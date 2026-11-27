import crypto from "crypto";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";

const hash = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const invalidRefresh = () => new AppError("Sessão expirada. Faça login novamente.", 401, "INVALID_REFRESH_TOKEN");

const issue = async (userId: string, familyId: string) => {
  const refreshToken = crypto.randomBytes(32).toString("base64url");
  await prisma.refreshToken.create({
    data: {
      userId,
      familyId,
      tokenHash: hash(refreshToken),
      expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * 86_400_000),
    },
  });
  return { refreshToken, sessionId: familyId };
};

const revokeFamily = (familyId: string) =>
  prisma.refreshToken.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: new Date() } });

export const sessionService = {
  start: (userId: string) => issue(userId, crypto.randomUUID()),

  /**
   * Troca o refresh token por um novo (uso único). Reapresentar um token já usado indica
   * cópia: a sessão inteira é encerrada.
   */
  async rotate(refreshToken: string) {
    const current = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(refreshToken) } });
    if (!current || current.expiresAt <= new Date()) throw invalidRefresh();

    // `revokedAt: null` na condição torna o consumo atômico entre chamadas concorrentes.
    const consumed = await prisma.refreshToken.updateMany({
      where: { id: current.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (consumed.count === 0) {
      await revokeFamily(current.familyId);
      throw invalidRefresh();
    }

    return { userId: current.userId, ...(await issue(current.userId, current.familyId)) };
  },

  async isActive(familyId: string) {
    const active = await prisma.refreshToken.findFirst({
      where: { familyId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    return Boolean(active);
  },

  revoke: revokeFamily,

  async revokeByToken(refreshToken: string) {
    const found = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(refreshToken) } });
    if (found) await revokeFamily(found.familyId);
  },
};
