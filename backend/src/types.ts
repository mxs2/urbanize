import { UserRole } from "./generated/prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  nome: string;
  organId?: string | null;
  acessoGeral: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
