import "dotenv/config";
import path from "path";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOrigin = (value: string) => value.replace(/\/+$/, "");

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProductionEnv = nodeEnv === "production";

const allowedOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

/**
 * Em desenvolvimento host e porta do cliente variam muito (Expo web, IP da rede
 * local), então liberamos qualquer origem. Em produção vale a lista de FRONTEND_URL.
 */
export const isOriginAllowed = (origin: string | undefined) => {
  // Apps nativos e requisições same-origin não enviam Origin.
  if (!origin) return true;
  if (!isProductionEnv) return true;
  return allowedOrigins.includes(normalizeOrigin(origin));
};

/**
 * Sem valor padrão: um segredo fixo no código permitiria a qualquer pessoa
 * gerar tokens válidos. Rode `scripts/setup-env.sh` ou copie `.env.example`.
 */
const requireEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} não está definido. Configure ${name} no arquivo backend/.env antes de iniciar o backend.`);
  }
  return value;
};

const JWT_SECRET_PLACEHOLDERS = ["troque-este-segredo", "urbanize-dev-secret-change-me"];
const JWT_SECRET_MIN_LENGTH = 32;

/**
 * Em produção recusa segredos de exemplo (públicos no repositório) ou curtos.
 * Em desenvolvimento e testes aceita qualquer valor não vazio.
 */
const requireJwtSecret = () => {
  const value = requireEnv("JWT_SECRET");
  if (isProductionEnv && (JWT_SECRET_PLACEHOLDERS.includes(value) || value.length < JWT_SECRET_MIN_LENGTH)) {
    throw new Error(
      `JWT_SECRET é de exemplo ou tem menos de ${JWT_SECRET_MIN_LENGTH} caracteres. Gere um valor aleatório, por exemplo: openssl rand -hex 32`
    );
  }
  return value;
};

export const env = {
  nodeEnv,
  port: toNumber(process.env.BACKEND_PORT ?? process.env.PORT, 4000),
  /** 0.0.0.0 permite acesso pelo IP da rede local (dispositivo físico). */
  host: process.env.BACKEND_HOST ?? "0.0.0.0",
  allowedOrigins,
  /**
   * Saltos de proxy reverso confiáveis (Caddy, Render...). Sem isso `req.secure` e `req.ip`
   * ignoram X-Forwarded-*. Em produção o padrão é 1; 0 desliga.
   */
  trustProxy: toNumber(process.env.TRUST_PROXY, isProductionEnv ? 1 : 0),
  /** RS08: em produção recusa requisições que não chegaram por HTTPS. */
  requireHttps: isProductionEnv && process.env.REQUIRE_HTTPS !== "false",
  jwtSecret: requireJwtSecret(),
  /** Token de acesso curto; a sessão se renova pelo refresh token (RS04). */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshTokenTtlDays: toNumber(process.env.REFRESH_TOKEN_TTL_DAYS, 7),
  /** RS03. Desligado nos testes, que fazem muitos logins do mesmo IP. */
  authRateLimit: nodeEnv !== "test" && process.env.AUTH_RATE_LIMIT !== "false",
  cookieName: process.env.AUTH_COOKIE_NAME ?? "urbanize_session",
  redisUrl: process.env.REDIS_URL,
  metricsCron: process.env.METRICS_CRON ?? "*/15 * * * *",
  retentionCron: process.env.RETENTION_CRON ?? "0 3 * * *",
  /** RS20: meses até anonimizar o contato de demandas encerradas. */
  retentionMonths: Math.max(1, toNumber(process.env.RETENTION_MONTHS, 12)),
  /** Validade dos links assinados de /uploads. */
  uploadUrlTtlSeconds: toNumber(process.env.UPLOAD_URL_TTL_SECONDS, 3600),
  /** RS26–RS29. A chave não tem valor padrão (RS11): sem ela o backup diário não roda. */
  backupKey: process.env.BACKUP_ENCRYPTION_KEY?.trim() || null,
  backupDir: path.resolve(process.env.BACKUP_DIR || "backups"),
  /** Cópia fora do servidor principal (disco remoto ou armazenamento em nuvem montado). */
  backupOffsiteDir: process.env.BACKUP_OFFSITE_DIR ? path.resolve(process.env.BACKUP_OFFSITE_DIR) : null,
  backupCron: process.env.BACKUP_CRON ?? "0 2 * * *",
  googleCredentials: process.env.GOOGLE_VISION_CREDENTIALS ?? null,
};

export const isProduction = isProductionEnv;
