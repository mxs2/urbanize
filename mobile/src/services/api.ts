import axios, { AxiosError } from "axios";
import { getAuthToken, getRefreshToken, publishSession } from "./session";
import { API_BASE_URL, SERVER_BASE_URL } from "@/config/env";
import { Demand, DemandCategory, FilterState, ImageTriage, NewDemandInput } from "@/types/demand";
import { MetricsSummary } from "@/types/metrics";
import { ProfileChanges, User } from "@/types/user";
import { Organ } from "@/types/organ";
import { AuthResult } from "@/types/auth";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error?: {
    code: string;
    message: string;
  };
}

export const resolveImageUrl = (imagemUrl?: string) => {
  if (!imagemUrl) return undefined;
  return imagemUrl.startsWith("http") ? imagemUrl : `${SERVER_BASE_URL}${imagemUrl}`;
};

/** Erro de comunicação com a API, com o motivo separado para a UI decidir o que mostrar. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: "offline" | "timeout" | "http",
    readonly status?: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const isOfflineError = (error: unknown) =>
  error instanceof ApiError && (error.kind === "offline" || error.kind === "timeout");

const REQUEST_TIMEOUT_MS = 15_000;

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

http.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Nestas rotas um 401 é a resposta final, não um token de acesso vencido. */
const NO_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

let refreshing: Promise<boolean> | null = null;

const renewSession = async (): Promise<boolean> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    publishSession(null, null);
    return false;
  }
  try {
    const { data } = await http.post<ApiResponse<{ token: string; refreshToken: string }>>("/auth/refresh", {
      refreshToken,
    });
    publishSession(data.data.token, data.data.refreshToken);
    return true;
  } catch (error) {
    // Só encerra a sessão se o servidor recusou; falha de rede permite tentar de novo.
    if ((error as AxiosError).response?.status === 401) publishSession(null, null);
    return false;
  }
};

http.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (typeof error.config & { retried?: boolean }) | undefined;
  if (error.response?.status !== 401 || !config || config.retried || NO_REFRESH.includes(config.url ?? "")) {
    throw error;
  }

  // Uma única renovação para todas as requisições que falharam juntas: o refresh token é de uso único.
  refreshing ??= renewSession().finally(() => {
    refreshing = null;
  });
  if (!(await refreshing)) throw error;

  config.retried = true;
  return http.request(config);
});

const normalizeError = (error: unknown): never => {
  if (!axios.isAxiosError(error)) throw error;

  const axiosError = error as AxiosError<ApiErrorResponse>;
  if (axiosError.code === "ECONNABORTED") {
    throw new ApiError("O servidor demorou para responder. Tente novamente.", "timeout");
  }
  if (!axiosError.response) {
    throw new ApiError("Sem conexão com o servidor. Verifique sua internet.", "offline");
  }

  // Um 401 que chega aqui já passou pela tentativa de renovação do interceptor.
  const { status, data } = axiosError.response;
  const message = data?.error?.message ?? `Erro ao comunicar com o backend (HTTP ${status}).`;
  throw new ApiError(message, "http", status, data?.error?.code);
};

/** Executa a chamada, devolve `data` do envelope `{ success, data }` e padroniza o erro. */
const call = async <T>(request: () => Promise<{ data: ApiResponse<T> }>): Promise<T> => {
  try {
    return (await request()).data.data;
  } catch (error) {
    return normalizeError(error);
  }
};

export const api = {
  getDemands: (filters: FilterState = {}) =>
    call(() => http.get<ApiResponse<Demand[]>>("/demands", { params: filters })),

  getDemandById: (id: string) => call(() => http.get<ApiResponse<Demand>>(`/demands/${id}`)),

  createDemand: (payload: NewDemandInput) => call(() => http.post<ApiResponse<Demand>>("/demands", payload)),

  updateDemandStatus: (id: string, status: Demand["status"], observacaoGestor?: string) =>
    call(() => http.patch<ApiResponse<Demand>>(`/demands/${id}/status`, { status, observacaoGestor })),

  getMetrics: () => call(() => http.get<ApiResponse<MetricsSummary>>("/metrics/summary")),

  login: (email: string, senha: string) =>
    call(() => http.post<ApiResponse<AuthResult>>("/auth/login", { email, senha })),

  register: (nome: string, email: string, senha: string, telefone?: string) =>
    call(() => http.post<ApiResponse<AuthResult>>("/auth/register", { nome, email, senha, telefone })),

  me: async (): Promise<User> => (await call(() => http.get<ApiResponse<{ user: User }>>("/auth/me"))).user,

  updateMe: async (changes: ProfileChanges): Promise<User> =>
    (await call(() => http.patch<ApiResponse<{ user: User }>>("/auth/me", changes))).user,

  exportMyData: () => call(() => http.get<ApiResponse<unknown>>("/auth/me/dados")),

  deleteMe: async (senha: string): Promise<void> => {
    await call(() => http.delete<ApiResponse<null>>("/auth/me", { data: { senha } }));
  },

  logout: async (): Promise<void> => {
    const refreshToken = await getRefreshToken();
    await call(() => http.post<ApiResponse<null>>("/auth/logout", refreshToken ? { refreshToken } : {}));
  },

  getOrgans: () => call(() => http.get<ApiResponse<Organ[]>>("/organs")),

  registerPushToken: (token: string, platform: string) =>
    call(() => http.post<ApiResponse<{ token: string }>>("/notifications/token", { token, platform })),

  unregisterPushToken: async (token: string): Promise<void> => {
    await call(() => http.delete<ApiResponse<null>>("/notifications/token", { data: { token } }));
  },

  uploadImage: (photo: { uri: string; name: string; type: string }, categoria?: DemandCategory) => {
    const formData = new FormData();
    // O FormData do React Native aceita { uri, name, type } como arquivo.
    formData.append("imagem", photo as unknown as Blob);
    if (categoria) formData.append("categoria", categoria);

    return call(() =>
      http.post<ApiResponse<ImageTriage>>("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },
};
