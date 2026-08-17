import AsyncStorage from "@react-native-async-storage/async-storage";

/** Chave usada pelo `persist` do authStore — compartilhada para não haver divergência. */
export const AUTH_STORAGE_KEY = "urbanize-auth";

/**
 * O token vive em memória e é a fonte da verdade para as requisições.
 *
 * O `persist` do zustand grava em AsyncStorage de forma assíncrona, então ler do
 * storage a cada request abre uma janela em que a escrita do login ainda não
 * terminou e a próxima chamada sai sem Authorization. Aqui o login atualiza a
 * memória de forma síncrona e o storage serve apenas para o cold start.
 */
let token: string | null = null;
let coldStartRead: Promise<string | null> | null = null;

const readPersistedToken = async (): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
};

export const setAuthToken = (next: string | null) => {
  token = next;
  // A memória passa a valer; não há mais motivo para consultar o storage.
  coldStartRead = Promise.resolve(next);
};

export const clearAuthToken = () => setAuthToken(null);

export const getAuthToken = async (): Promise<string | null> => {
  if (token) return token;
  coldStartRead ??= readPersistedToken();
  return coldStartRead;
};

/** Apenas para testes: volta ao estado inicial do módulo. */
export const resetSessionForTests = () => {
  token = null;
  coldStartRead = null;
};
