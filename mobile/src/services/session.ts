import { secureStorage } from "./secureStorage";

/** Chave usada pelo `persist` do authStore — compartilhada para não haver divergência. */
export const AUTH_STORAGE_KEY = "urbanize-auth";

/**
 * O token vive em memória e é a fonte da verdade para as requisições.
 *
 * O `persist` do zustand grava no armazenamento seguro de forma assíncrona, então ler do
 * storage a cada request abre uma janela em que a escrita do login ainda não
 * terminou e a próxima chamada sai sem Authorization. Aqui o login atualiza a
 * memória de forma síncrona e o storage serve apenas para o cold start.
 */
export interface SessionTokens {
  token: string | null;
  refreshToken: string | null;
}

const EMPTY: SessionTokens = { token: null, refreshToken: null };

let current: SessionTokens | null = null;
let coldStartRead: Promise<SessionTokens> | null = null;
let listener: ((tokens: SessionTokens) => void) | null = null;

const readPersisted = async (): Promise<SessionTokens> => {
  try {
    const raw = await secureStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return EMPTY;
    const { state } = JSON.parse(raw) as { state?: Partial<SessionTokens> };
    return { token: state?.token ?? null, refreshToken: state?.refreshToken ?? null };
  } catch {
    return EMPTY;
  }
};

const read = async (): Promise<SessionTokens> => {
  if (current) return current;
  coldStartRead ??= readPersisted();
  const persisted = await coldStartRead;
  // Um login pode ter acontecido enquanto o storage era lido: a memória vence.
  return current ?? persisted;
};

export const setSession = (token: string | null, refreshToken: string | null = null) => {
  current = { token, refreshToken };
};

export const setAuthToken = (next: string | null) => setSession(next, current?.refreshToken ?? null);

export const clearAuthToken = () => setSession(null, null);

export const getAuthToken = async () => (await read()).token;

export const getRefreshToken = async () => (await read()).refreshToken;

/** O authStore se registra aqui para persistir a renovação (ou o fim) da sessão. */
export const onSessionChange = (next: (tokens: SessionTokens) => void) => {
  listener = next;
};

/** Mudança de sessão originada na camada de API (renovação ou expiração). */
export const publishSession = (token: string | null, refreshToken: string | null) => {
  setSession(token, refreshToken);
  listener?.({ token, refreshToken });
};

/** Apenas para testes: volta ao estado inicial do módulo. */
export const resetSessionForTests = () => {
  current = null;
  coldStartRead = null;
  listener = null;
};
