import { api, DemandUpdatePayload } from "./api";
import { Demand, FilterState } from "@/types/demand";

export const demandService = {
  getAll: (filters?: FilterState) => api.getDemands(filters),
  getById: (id: string) => api.getDemandById(id),
  create: (payload: Omit<Demand, "id" | "protocolo" | "criadaEm" | "atualizadaEm">) =>
    api.createDemand(payload),
  update: (id: string, payload: DemandUpdatePayload) => api.updateDemand(id, payload),
  remove: (id: string) => api.deleteDemand(id),
  updateStatus: (id: string, status: Demand["status"], observacaoGestor?: string) =>
    api.updateDemandStatus(id, status, observacaoGestor),
};
