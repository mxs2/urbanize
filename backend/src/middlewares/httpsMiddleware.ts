import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

/** O healthcheck do Docker chama a API por HTTP em 127.0.0.1, dentro do container. */
const HTTP_ALLOWED_PATHS = ["/api/health"];

/**
 * RS08: em produção, toda requisição precisa ter chegado por HTTPS (a terminação TLS é do
 * proxy reverso, que informa o protocolo em X-Forwarded-Proto — ver `trust proxy` em app.ts).
 * Também envia HSTS para que o navegador não volte a usar HTTP.
 */
export const requireHttps = (req: Request, res: Response, next: NextFunction) => {
  if (!env.requireHttps) return next();

  if (req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    return next();
  }

  if (HTTP_ALLOWED_PATHS.includes(req.path)) return next();

  return next(new AppError("Use HTTPS para acessar a API.", 426, "HTTPS_REQUIRED"));
};
