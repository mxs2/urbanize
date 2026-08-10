import { create } from "zustand";
import { demandService } from "@/services/demandService";
import { Demand, FilterState } from "@/types/demand";

interface DemandState {
  demands: Demand[];
  selected?: Demand;
  loading: boolean;
  error?: string;
  filters: FilterState;
  fetchDemands: (filters?: FilterState) => Promise<void>;
  fetchDemandById: (id: string) => Promise<void>;
  createDemand: (payload: Omit<Demand, "id" | "protocolo" | "criadaEm" | "atualizadaEm">) => Promise<Demand>;
  updateDemandStatus: (id: string, status: Demand["status"], observacaoGestor?: string) => Promise<void>;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
}

export const useDemandStore = create<DemandState>((set, get) => ({
  demands: [],
  loading: false,
  filters: {},
  async fetchDemands(filters = {}) {
    set({ loading: true, error: undefined, filters });
    try {
      const data = await demandService.getAll(filters);
      set({ demands: data, loading: false });
    } catch {
      set({ error: "Erro ao carregar demandas", loading: false });
    }
  },
  async fetchDemandById(id) {
    set({ loading: true, error: undefined });
    try {
      const demand = await demandService.getById(id);
      if (demand) set({ selected: demand });
      set({ loading: false });
    } catch {
      set({ error: "Erro ao carregar demanda", loading: false });
    }
  },
  async createDemand(payload) {
    set({ loading: true, error: undefined });
    const created = await demandService.create(payload);
    set({ demands: [created, ...get().demands], loading: false });
    return created;
  },
  async updateDemandStatus(id, status, observacaoGestor) {
    set({ loading: true, error: undefined });
    const updated = await demandService.updateStatus(id, status, observacaoGestor);
    set({
      demands: get().demands.map((d) => (d.id === id ? updated ?? d : d)),
      selected: updated ?? get().selected,
      loading: false,
    });
  },
  setFilters(filters) {
    set({ filters });
  },
  clearFilters() {
    set({ filters: {} });
  },
}));
