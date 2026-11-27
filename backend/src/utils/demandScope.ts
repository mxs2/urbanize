import { UserRole } from "../generated/prisma/client";

export interface Actor {
  id: string;
  role: UserRole;
  organId?: string | null;
  acessoGeral?: boolean;
}

/**
 * RS06: o que cada um enxerga. `null` = tudo (gestor de acesso geral).
 * Gestor sem órgão e sem acesso geral não recebe nada (falha fechada).
 */
export const demandScope = (user: Actor): { userId?: string; organId?: string } | null => {
  if (user.role !== "gestor") return { userId: user.id };
  if (user.acessoGeral) return null;
  // Um filtro `organId` vazio seria ignorado pelo Prisma e liberaria tudo.
  return { organId: user.organId || "sem-orgao" };
};

export const canAccessDemand = (user: Actor, demand: { userId: string | null; organId: string | null }) => {
  if (demand.userId === user.id) return true;
  if (user.role !== "gestor") return false;
  return Boolean(user.acessoGeral) || (Boolean(user.organId) && demand.organId === user.organId);
};
