import { api } from "./api";
import { Demand, FilterState, NewDemandInput } from "@/types/demand";

export const demandService = {
  getAll: (filters?: FilterState) => api.getDemands(filters),
  getById: (id: string) => api.getDemandById(id),
  create: (payload: NewDemandInput) => api.createDemand(payload),
  updateStatus: (id: string, status: Demand["status"], observacaoGestor?: string) =>
    api.updateDemandStatus(id, status, observacaoGestor),
};
