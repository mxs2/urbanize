import { Router, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { requireAuth } from "../middlewares/authMiddleware";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

const userId = (req: Request) => {
  if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
  return req.user.id;
};

// Avisos do usuário logado, mais recentes primeiro.
notificationRoutes.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const notificacoes = await prisma.notification.findMany({
      where: { userId: userId(req) },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      success: true,
      data: notificacoes.map(({ id, demandId, mensagem, lida, createdAt }) => ({
        id,
        demandId,
        mensagem,
        lida,
        criadaEm: createdAt.toISOString(),
      })),
    });
  })
);

notificationRoutes.patch(
  "/read-all",
  asyncHandler(async (req: Request, res: Response) => {
    const { count } = await prisma.notification.updateMany({
      where: { userId: userId(req), lida: false },
      data: { lida: true },
    });
    res.json({ success: true, data: { atualizadas: count } });
  })
);
