import { User, DemandRole } from "./user";

export interface AuthPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload extends AuthPayload {
  nome: string;
  telefone?: string;
  role?: DemandRole;
}

export interface AuthStateSnapshot {
  user: User | null;
  token: string | null;
}
