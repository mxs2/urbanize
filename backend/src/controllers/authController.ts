import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env, isProduction } from "../config/env";
import { authService } from "../services/authService";
import { privacyService } from "../services/privacyService";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/appError";
import { newPasswordSchema } from "../utils/passwordPolicy";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

const registerSchema = loginSchema.extend({
  nome: z.string().min(2),
  senha: newPasswordSchema,
  telefone: z.string().optional(),
  // O cadastro público só cria cidadãos. Gestores são promovidos por outro gestor.
  role: z.literal("cidadao").optional(),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const logoutSchema = refreshSchema.partial();
const promoteSchema = z.object({ email: z.string().email(), organId: z.string().min(1).optional() });

const demoteSchema = z.object({ email: z.string().email() });
const updateMeSchema = z
  .object({
    nome: z.string().trim().min(2).optional(),
    email: z.string().email().optional(),
    telefone: z.string().trim().nullable().optional(),
    senhaAtual: z.string().optional(),
  })
  .refine((data) => data.nome !== undefined || data.email !== undefined || data.telefone !== undefined, {
    message: "Informe ao menos um dado para corrigir.",
  });
const deleteMeSchema = z.object({ senha: z.string().min(1) });

const setAuthCookie = (res: Response, token: string) => {
  // O cookie dura o mesmo que o token que carrega (JWT_EXPIRES_IN).
  const { exp } = jwt.decode(token) as { exp: number };
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: exp * 1000 - Date.now(),
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
    const result = await authService.register(payload, req.ip);
    setAuthCookie(res, result.token);
    res.status(201).json({ success: true, data: result });
  }),
  login: asyncHandler(async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload, req.ip);
    setAuthCookie(res, result.token);
    res.json({ success: true, data: result });
  }),
  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
    const user = await authService.me(req.user.id);
    res.json({ success: true, data: { user } });
  }),
  updateMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
    const user = await privacyService.update(req.user.id, updateMeSchema.parse(req.body), req.ip);
    res.json({ success: true, data: { user } });
  }),
  exportMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
    const data = await privacyService.exportData(req.user.id, req.ip);
    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data });
  }),
  deleteMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
    const { senha } = deleteMeSchema.parse(req.body);
    await privacyService.deleteAccount(req.user.id, senha, req.ip);
    clearAuthCookie(res);
    res.json({ success: true, data: null });
  }),
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await authService.refresh(refreshToken);
    setAuthCookie(res, result.token);
    res.json({ success: true, data: result });
  }),
  promoteGestor: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
    const user = await authService.promoteGestor(promoteSchema.parse(req.body), req.user, req.ip);
    res.json({ success: true, data: { user } });
  }),
  demoteGestor: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
    const { email } = demoteSchema.parse(req.body);
    const user = await authService.demoteGestor(email, req.user, req.ip);
    res.json({ success: true, data: { user } });
  }),
  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = logoutSchema.parse(req.body ?? {});
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined;
    await authService.logout({ refreshToken, accessToken: req.cookies?.[env.cookieName] ?? bearer });
    clearAuthCookie(res);
    res.json({ success: true, data: null });
  }),
};
