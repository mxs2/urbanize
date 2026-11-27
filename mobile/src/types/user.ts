export type DemandRole = "cidadao" | "gestor";

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: DemandRole;
  senha?: string;
}

export interface ProfileChanges {
  nome?: string;
  email?: string;
  telefone?: string | null;
  senhaAtual?: string;
}
