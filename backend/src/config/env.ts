import "dotenv/config";

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

export const env = {
  nodeEnv,
  port: toNumber(process.env.BACKEND_PORT ?? process.env.PORT, 4000),
  /** 0.0.0.0 permite acesso pelo IP da rede local (dispositivo físico). */
  host: process.env.BACKEND_HOST ?? "0.0.0.0",
  allowedOrigins,
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.AUTH_COOKIE_NAME ?? "urbanize_session",
  redisUrl: process.env.REDIS_URL,
  metricsCron: process.env.METRICS_CRON ?? "*/15 * * * *",
  googleCredentials: process.env.GOOGLE_VISION_CREDENTIALS ?? null,
};

export const isProduction = isProductionEnv;
