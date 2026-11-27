import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { UserRole } from "../generated/prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { sessionService } from "../services/sessionService";
import "../types";

interface JwtPayload {
  sub: string;
  /** Família do refresh token: permite revogar o acesso antes do `exp` (RS04). */
  sid?: string;
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined;
    const token = req.cookies?.[env.cookieName] ?? bearer;

    if (!token) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) throw new AppError("Usuário não encontrado.", 401, "UNAUTHENTICATED");
    if (!payload.sid || !(await sessionService.isActive(payload.sid))) {
      throw new AppError("Sessão encerrada. Faça login novamente.", 401, "SESSION_REVOKED");
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      nome: user.nome,
      organId: user.organId,
      acessoGeral: user.acessoGeral,
    };

    next();
  } catch (error) {
    next(
      error instanceof AppError ? error : new AppError("Token inválido ou expirado.", 401, "INVALID_TOKEN")
    );
  }
};

/** RS07: ponto único de checagem de papel. Use depois de `requireAuth`. */
export const requireRole =
  (roles: UserRole[], message = "Perfil sem permissão para esta ação.") =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED"));
    if (!roles.includes(req.user.role)) return next(new AppError(message, 403, "FORBIDDEN"));
    return next();
  };
