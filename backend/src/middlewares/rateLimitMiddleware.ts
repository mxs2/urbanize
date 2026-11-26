import rateLimit from "express-rate-limit";
import { AppError } from "../utils/appError";

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
