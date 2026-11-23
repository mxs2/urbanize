import { NextFunction, Request, Response } from "express";
import path from "path";
import { AppError } from "../utils/appError";
import { isSafeUploadFilename, verifyUploadSignature } from "../utils/signedUpload";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

/**
 * Serve uma foto apenas com link assinado e dentro do prazo. Os links são emitidos
 * em `toDemandResponse`, ou seja, só para quem tem permissão de ver a demanda.
 */
export const serveUpload = (req: Request, res: Response, next: NextFunction) => {
  let filename: string;
  try {
    filename = decodeURIComponent(req.path.replace(/^\//, ""));
  } catch {
    // `%` malformado: sem o try/catch viraria 500.
    return next(new AppError("Arquivo não encontrado.", 404, "NOT_FOUND"));
  }

  if (!isSafeUploadFilename(filename)) return next(new AppError("Arquivo não encontrado.", 404, "NOT_FOUND"));
  if (!verifyUploadSignature(filename, req.query.expires, req.query.signature)) {
    return next(new AppError("Link de imagem inválido ou expirado.", 403, "INVALID_UPLOAD_LINK"));
  }

  res.setHeader("Cache-Control", "private, max-age=300");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(filename, { root: UPLOAD_DIR, dotfiles: "deny" }, (error) => {
    if (error) next(new AppError("Arquivo não encontrado.", 404, "NOT_FOUND"));
  });
};
