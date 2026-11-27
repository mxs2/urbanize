import { Request } from "express";
import rateLimit, { Options } from "express-rate-limit";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

/**
 * RS03: limites das rotas de autenticação. Os contadores ficam em memória, o que basta
 * para uma única instância da API.
 */
const limiter = (options: Partial<Options>) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => !env.authRateLimit,
    handler: (_req, _res, next) =>
      next(new AppError("Muitas tentativas. Aguarde alguns minutos.", 429, "TOO_MANY_REQUESTS")),
    ...options,
  });

const emailKey = (req: Request) => String(req.body?.email ?? "").trim().toLowerCase();

/** Falhas de login por IP. Logins corretos não contam. */
export const loginIpLimiter = limiter({ limit: 20, skipSuccessfulRequests: true });

/**
 * Falhas de login por conta, mesmo vindas de IPs diferentes. Efeito colateral conhecido:
 * quem errar de propósito bloqueia a conta alheia por até 15 minutos.
 */
export const loginAccountLimiter = limiter({
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: emailKey,
  skip: (req) => !env.authRateLimit || !emailKey(req),
});

/** Cadastros por IP. */
export const registerLimiter = limiter({ windowMs: 60 * 60 * 1000, limit: 20 });

/**
 * Limita o acesso às fotos: cada requisição valida assinatura e lê o disco,
 * então sem limite um cliente poderia forçar links ou sobrecarregar o I/O.
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new AppError("Muitas requisições. Tente novamente em instantes.", 429, "TOO_MANY_REQUESTS")),
});
