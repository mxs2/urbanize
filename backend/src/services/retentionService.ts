import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { ANONIMO, anonymizeContact } from "./anonymizationService";

const monthsAgo = (months: number, now: Date) => {
  const date = new Date(now);
  date.setMonth(date.getMonth() - months);
  return date;
};

export const retentionService = {
  /**
   * RS20: anonimiza o contato das demandas encerradas há mais de `RETENTION_MONTHS` e
   * apaga os registros de auditoria do mesmo período.
   */
  async apply(now = new Date()) {
    const limit = monthsAgo(env.retentionMonths, now);
    const closed = await prisma.demand.findMany({
      where: { status: { in: ["resolvida", "cancelada"] }, nomeSolicitante: { not: ANONIMO } },
      include: { historico: { orderBy: { createdAt: "desc" } } },
    });
    // O prazo conta da entrada no histórico: `updatedAt` muda com qualquer edição.
    const expired = closed.filter((demand) => {
      const closedAt = demand.historico.find((item) => item.status === demand.status)?.createdAt;
      return closedAt !== undefined && closedAt < limit;
    });

    for (const demand of expired) {
      await prisma.$transaction((tx) => anonymizeContact(tx, demand));
    }
    const { count } = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: limit } } });

    return { demandas: expired.length, auditoria: count };
  },
};
