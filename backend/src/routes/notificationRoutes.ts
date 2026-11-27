import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/authMiddleware";
import { isExpoPushToken, notificationService } from "../services/notificationService";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

const tokenSchema = z.object({
  token: z.string().refine(isExpoPushToken, "Token Expo Push inválido."),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

const userId = (req: Request) => {
  if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
  return req.user.id;
};

notificationRoutes.post(
  "/token",
  asyncHandler(async (req: Request, res: Response) => {
    const { token, platform } = tokenSchema.parse(req.body);
    await notificationService.registerToken(userId(req), token, platform);
    res.status(201).json({ success: true, data: { token } });
  })
);

notificationRoutes.delete(
  "/token",
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = tokenSchema.pick({ token: true }).parse(req.body);
    await notificationService.removeToken(userId(req), token);
    res.json({ success: true, data: null });
  })
);
