import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/services/authService";
import { demandCache } from "@/services/demandCache";
import { secureStorage } from "@/services/secureStorage";
import { AUTH_STORAGE_KEY, clearAuthToken, onSessionChange, setSession } from "@/services/session";
import { ProfileChanges, User } from "@/types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (
    nome: string,
    email: string,
    senha: string,
    telefone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (changes: ProfileChanges) => Promise<void>;
  deleteAccount: (senha: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      hydrated: false,
      login: async (email: string, senha: string) => {
        if (get().loading) return;

        set({ loading: true });
        try {
          const { user, token, refreshToken } = await authService.login({ email, senha });
          // Antes de liberar a UI: o token precisa estar disponível para o interceptor,
          // senão a primeira requisição da próxima tela sai sem Authorization.
          setSession(token, refreshToken);
          set({ user, token, refreshToken, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      register: async (nome, email, senha, telefone) => {
        if (get().loading) return;

        set({ loading: true });
        try {
          const { user, token, refreshToken } = await authService.register({ nome, email, telefone, senha });
          setSession(token, refreshToken);
          set({ user, token, refreshToken, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      logout: async () => {
        const userId = get().user?.id;
        await authService.logout().catch(() => undefined);
        // O cache tem dados pessoais das demandas: não fica no aparelho depois do logout.
        if (userId) await demandCache.clear(userId);
        clearAuthToken();
        set({ user: null, token: null, refreshToken: null });
      },
      updateProfile: async (changes) => {
        set({ user: await authService.updateMe(changes) });
      },
      deleteAccount: async (senha) => {
        await authService.deleteMe(senha);
        clearAuthToken();
        set({ user: null, token: null, refreshToken: null });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken }),
      onRehydrateStorage: () => (state) => {
        setSession(state?.token ?? null, state?.refreshToken ?? null);
        // Via setState (e não mutando `state`) para que os componentes já montados
        // re-renderizem; marcado mesmo em caso de falha, senão a UI fica presa no loading.
        useAuthStore.setState({ hydrated: true });
      },
    }
  )
);

// Renovação vinda da API é persistida; sessão encerrada derruba o usuário (useRoleGuard redireciona).
onSessionChange(({ token, refreshToken }) => {
  useAuthStore.setState(token ? { token, refreshToken } : { user: null, token: null, refreshToken: null });
});
