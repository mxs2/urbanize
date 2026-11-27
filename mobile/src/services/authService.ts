import { api } from "./api";
import { AuthPayload, RegisterPayload } from "@/types/auth";
import { ProfileChanges, User } from "@/types/user";

export const authService = {
  login: (payload: AuthPayload): Promise<{ user: User; token: string; refreshToken: string }> =>
    api.login(payload.email, payload.senha),
  register: (payload: RegisterPayload): Promise<{ user: User; token: string; refreshToken: string }> =>
    api.register(payload.nome, payload.email, payload.senha, payload.telefone),
  me: (): Promise<User> => api.me(),
  updateMe: (changes: ProfileChanges): Promise<User> => api.updateMe(changes),
  deleteMe: (senha: string): Promise<void> => api.deleteMe(senha),
  logout: (): Promise<void> => api.logout(),
};
