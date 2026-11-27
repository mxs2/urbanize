import { User } from "./user";

export interface AuthPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload extends AuthPayload {
  nome: string;
  telefone?: string;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}
