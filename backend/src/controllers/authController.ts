import { Request, Response } from "express";
import { z } from "zod";
import { env, isProduction } from "../config/env";
import { authService } from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/appError";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

const registerSchema = loginSchema.extend({
  nome: z.string().min(2),
  telefone: z.string().optional(),
  // O cadastro público só cria cidadãos. Gestores vêm do seed.
  role: z.literal("cidadao").optional(),
});

const setAuthCookie = (res: Response, token: string) => {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookie = (res: Response) => {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });
};

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { role: _role, ...payload } = registerSchema.parse(req.body);
    const result = await authService.register(payload);
    setAuthCookie(res, result.token);
    res.status(201).json({ success: true, data: result });
  }),
  login: asyncHandler(async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);
    setAuthCookie(res, result.token);
    res.json({ success: true, data: result });
  }),
  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
    const user = await authService.me(req.user.id);
    res.json({ success: true, data: { user } });
  }),
  logout: asyncHandler(async (_req: Request, res: Response) => {
    clearAuthCookie(res);
    res.json({ success: true, data: null });
  }),
};
