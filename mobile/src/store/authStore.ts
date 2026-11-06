import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@/services/authService";
import { AUTH_STORAGE_KEY, clearAuthToken, setAuthToken, setUnauthorizedHandler } from "@/services/session";
import { User, DemandRole } from "@/types/user";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (
    nome: string,
    email: string,
    senha: string,
    telefone?: string,
    role?: DemandRole
  ) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      hydrated: false,
      login: async (email: string, senha: string) => {
        if (get().loading) return;

        set({ loading: true });
        try {
          const { user, token } = await authService.login({ email, senha });
          // Antes de liberar a UI: o token precisa estar disponível para o interceptor,
          // senão a primeira requisição da próxima tela sai sem Authorization.
          setAuthToken(token);
          set({ user, token, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      register: async (nome, email, senha, telefone, role = "cidadao") => {
        if (get().loading) return;

        set({ loading: true });
        try {
          const { user, token } = await authService.register({ nome, email, telefone, senha, role });
          setAuthToken(token);
          set({ user, token, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      logout: async () => {
        await authService.logout().catch(() => undefined);
        clearAuthToken();
        set({ user: null, token: null });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        setAuthToken(state?.token ?? null);
        // Via setState (e não mutando `state`) para que os componentes já montados
        // re-renderizem; marcado mesmo em caso de falha, senão a UI fica presa no loading.
        useAuthStore.setState({ hydrated: true });

        // Revalida a sessão restaurada: se o token expirou, o interceptor de 401 faz o logout;
        // falhas de rede mantêm a sessão local (o usuário pode estar offline).
        if (state?.token) {
          authService
            .me()
            .then((user) => useAuthStore.setState({ user }))
            .catch(() => undefined);
        }
      },
    }
  )
);

// Token expirado/inválido em qualquer rota autenticada: encerra a sessão local.
// O layout privado observa `user` e redireciona para /login.
setUnauthorizedHandler(() => {
  if (useAuthStore.getState().user) void useAuthStore.getState().logout();
});
