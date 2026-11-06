import axios, { AxiosError } from "axios";
import { getAuthToken, notifyUnauthorized } from "./session";
import { Demand, DemandCategory, FilterState } from "@/types/demand";
import { MetricsSummary } from "@/types/metrics";
import { User, DemandRole } from "@/types/user";
import { Organ } from "@/types/organ";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export type DemandUpdatePayload = Partial<
  Pick<Demand, "titulo" | "descricao" | "categoria" | "prioridade" | "imagemUrl">
> & { endereco?: Partial<Demand["endereco"]> };

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

// Rotas em que 401 significa "credenciais erradas", não "sessão expirada".
const PUBLIC_AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/logout"];

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url: string = error?.config?.url ?? "";
    const isPublic = PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isPublic) {
      notifyUnauthorized();
    }
    throw error;
  }
);

const unwrap =<T>(response: { data: ApiResponse<T> }) => response.data.data;

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

  async updateDemand(id: string, payload: DemandUpdatePayload): Promise<Demand> {
    try {
      return unwrap(await http.patch<ApiResponse<Demand>>(`/demands/${id}`, payload));
    } catch (error) {
      return normalizeError(error);
    }
  },

  async deleteDemand(id: string): Promise<void> {
    try {
      await http.delete<ApiResponse<null>>(`/demands/${id}`);
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

  async login(email: string, senha: string): Promise<{ user: User; token: string }> {
    try {
      return unwrap(
        await http.post<ApiResponse<{ user: User; token: string }>>("/auth/login", { email, senha })
      );
    } catch (error) {
      return normalizeError(error);
    }
  },

  async register(
    nome: string,
    email: string,
    senha: string,
    telefone?: string,
    role: DemandRole = "cidadao"
  ): Promise<{ user: User; token: string }> {
    try {
      return unwrap(
        await http.post<ApiResponse<{ user: User; token: string }>>("/auth/register", {
          nome,
          email,
          senha,
          telefone,
          role,
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

  async logout(): Promise<void> {
    try {
      await http.post<ApiResponse<null>>("/auth/logout");
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
