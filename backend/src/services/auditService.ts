import { prisma } from "../config/prisma";

export type AuditEvent =
  | "cadastro"
  | "login_sucesso"
  | "login_falha"
  | "troca_papel"
  | "correcao_dados"
  | "exportacao_dados"
  | "exclusao_conta";

export const auditService = {
  /** RS21. Uma falha ao auditar não pode derrubar a operação do usuário. */
  async record(evento: AuditEvent, data: { userId?: string; alvoId?: string; ip?: string } = {}) {
    try {
      await prisma.auditLog.create({ data: { evento, ...data } });
    } catch (error) {
      console.error(`Falha ao registrar auditoria (${evento}).`, error);
    }
  },
};
