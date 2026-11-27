import { prisma } from "../config/prisma";
import { erasureLedger } from "./erasureLedger";
import { privacyService } from "./privacyService";
import { retentionService } from "./retentionService";

/**
 * Depois de restaurar: o backup pode trazer de volta contas excluídas, contatos já
 * expirados e sessões encerradas. Reaplica as regras da Entrega 3.
 */
export const recoveryService = {
  async reapply() {
    let contas = 0;
    for (const userId of await erasureLedger.list()) {
      if (!(await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }))) continue;
      await privacyService.erase(userId);
      contas += 1;
    }
    const { demandas } = await retentionService.apply();
    const { count: sessoes } = await prisma.refreshToken.updateMany({
      where: { revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { contas, demandas, sessoes };
  },
};
