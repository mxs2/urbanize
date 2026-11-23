import crypto from "crypto";
import path from "path";
import { env } from "../config/env";

const UPLOAD_PREFIX = "/uploads/";

/** Nomes gerados pelo uploadMiddleware: `<timestamp>-<aleatório>.<ext>`. */
const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/;

/**
 * Chave derivada do JWT_SECRET para que a assinatura de arquivos nunca valha
 * como token de sessão (e vice-versa). Rotacionar o segredo invalida os links.
 */
const sign = (filename: string, expires: number) =>
  crypto.createHmac("sha256", env.jwtSecret).update(`uploads:${filename}:${expires}`).digest("hex");

export const isSafeUploadFilename = (filename: string) =>
  SAFE_FILENAME.test(filename) && !filename.startsWith(".") && path.basename(filename) === filename;

/**
 * Converte o caminho guardado no banco (`/uploads/x.jpg`) em um link com prazo.
 * Só deve ser chamado para quem já foi autorizado a ver a demanda.
 */
export const signUploadUrl = (stored: string | null | undefined) => {
  if (!stored) return undefined;
  // Valores com http(s) são URLs externas antigas; não pertencem a esta pasta.
  if (!stored.startsWith(UPLOAD_PREFIX)) return stored;

  const filename = stored.slice(UPLOAD_PREFIX.length).split("?")[0];
  if (!isSafeUploadFilename(filename)) return undefined;

  const expires = Math.floor(Date.now() / 1000) + env.uploadUrlTtlSeconds;
  return `${UPLOAD_PREFIX}${filename}?expires=${expires}&signature=${sign(filename, expires)}`;
};

export const verifyUploadSignature = (filename: string, expires: unknown, signature: unknown) => {
  if (typeof expires !== "string" || typeof signature !== "string") return false;
  const expiresAt = Number(expires);
  if (!Number.isInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(filename, expiresAt));
  const received = Buffer.from(signature);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

/** Remove query string e prefixo de host para guardar sempre `/uploads/<arquivo>`. */
export const toStoredUploadPath = (value: string) => {
  const withoutQuery = value.split("?")[0];
  const match = withoutQuery.match(/\/uploads\/([^/]+)$/);
  return match && isSafeUploadFilename(match[1]) ? `${UPLOAD_PREFIX}${match[1]}` : null;
};
