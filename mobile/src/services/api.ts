import axios, { AxiosError } from "axios";
import { getAuthToken, getRefreshToken, publishSession } from "./session";
import { Demand, DemandCategory, FilterState } from "@/types/demand";
import { MetricsSummary } from "@/types/metrics";
import { ProfileChanges, User } from "@/types/user";
import { Organ } from "@/types/organ";

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api";
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveImageUrl = (imagemUrl: string) =>
  imagemUrl.startsWith("http") ? imagemUrl : `${SERVER_BASE_URL}${imagemUrl}`;

const http = axios.create({
  baseURL: API_BASE_URL,
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

const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data;

const normalizeError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const message = axiosError.response?.data?.error?.message ?? "Erro ao comunicar com o backend.";
    throw new Error(message);
  }

  throw error;
};

export const api = {
  async getDemands(filters: FilterState = {}): Promise<Demand[]> {
    try {
      return unwrap(await http.get<ApiResponse<Demand[]>>("/demands", { params: filters }));
    } catch (error) {
      return normalizeError(error);
    }
  },

  async getDemandById(id: string): Promise<Demand | undefined> {
    try {
      return unwrap(await http.get<ApiResponse<Demand>>(`/demands/${id}`));
    } catch (error) {
      return normalizeError(error);
    }
  },

  async createDemand(
    payload: Omit<Demand, "id" | "protocolo" | "criadaEm" | "atualizadaEm">
  ): Promise<Demand> {
    try {
      return unwrap(await http.post<ApiResponse<Demand>>("/demands", payload));
    } catch (error) {
      return normalizeError(error);
    }
  },

  async updateDemandStatus(id: string, status: Demand["status"], observacaoGestor?: string): Promise<Demand> {
    try {
      return unwrap(
        await http.patch<ApiResponse<Demand>>(`/demands/${id}/status`, { status, observacaoGestor })
      );
    } catch (error) {
      return normalizeError(error);
    }
  },

  async getMetrics(): Promise<MetricsSummary> {
    try {
      return unwrap(await http.get<ApiResponse<MetricsSummary>>("/metrics/summary"));
    } catch (error) {
      return normalizeError(error);
    }
  },

  async login(email: string, senha: string): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      return unwrap(
        await http.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>("/auth/login", { email, senha })
      );
    } catch (error) {
      return normalizeError(error);
    }
  },

  async register(
    nome: string,
    email: string,
    senha: string,
    telefone?: string
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      return unwrap(
        await http.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>("/auth/register", {
          nome,
          email,
          senha,
          telefone,
        })
      );
    } catch (error) {
      return normalizeError(error);
    }
  },

  async me(): Promise<User> {
    try {
      const data = unwrap(await http.get<ApiResponse<{ user: User }>>("/auth/me"));
      return data.user;
    } catch (error) {
      return normalizeError(error);
    }
  },

  async updateMe(changes: ProfileChanges): Promise<User> {
    try {
      return unwrap(await http.patch<ApiResponse<{ user: User }>>("/auth/me", changes)).user;
    } catch (error) {
      return normalizeError(error);
    }
  },

  async exportMyData(): Promise<unknown> {
    try {
      return unwrap(await http.get<ApiResponse<unknown>>("/auth/me/dados"));
    } catch (error) {
      return normalizeError(error);
    }
  },

  async deleteMe(senha: string): Promise<void> {
    try {
      await http.delete<ApiResponse<null>>("/auth/me", { data: { senha } });
    } catch (error) {
      return normalizeError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await getRefreshToken();
      await http.post<ApiResponse<null>>("/auth/logout", refreshToken ? { refreshToken } : {});
    } catch (error) {
      return normalizeError(error);
    }
  },

  async getOrgans(): Promise<Organ[]> {
    try {
      return unwrap(await http.get<ApiResponse<Organ[]>>("/organs"));
    } catch (error) {
      return normalizeError(error);
    }
  },

  async uploadImage(
    photo: { uri: string; name: string; type: string },
    categoria?: DemandCategory
  ): Promise<{ imageUrl: string; triagem: { categoria: DemandCategory; score: number; labels: string[] } }> {
    try {
      const formData = new FormData();
      // React Native's FormData accepts this { uri, name, type } shape for file fields.
      formData.append("imagem", photo as unknown as Blob);
      if (categoria) formData.append("categoria", categoria);

      return unwrap(
        await http.post<
          ApiResponse<{
            imageUrl: string;
            triagem: { categoria: DemandCategory; score: number; labels: string[] };
          }>
        >("/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      );
    } catch (error) {
      return normalizeError(error);
    }
  },
};
