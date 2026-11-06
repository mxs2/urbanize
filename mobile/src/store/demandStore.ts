import { create } from "zustand";
import { demandService } from "@/services/demandService";
import type { DemandUpdatePayload } from "@/services/api";
import { Demand, FilterState } from "@/types/demand";

const mergeBairros = (current: string[], demands: Demand[]) =>
  Array.from(new Set([...current, ...demands.map((d) => d.endereco.bairro).filter(Boolean)])).sort((a, b) =>
    a.localeCompare(b)
  );

interface DemandState {
  demands: Demand[];
  bairros: string[];
  selected?: Demand;
  loading: boolean;
  error?: string;
  filters: FilterState;
  fetchDemands: (filters?: FilterState) => Promise<void>;
  fetchDemandById: (id: string) => Promise<void>;
  createDemand: (payload: Omit<Demand, "id" | "protocolo" | "criadaEm" | "atualizadaEm">) => Promise<Demand>;
  updateDemandStatus: (id: string, status: Demand["status"], observacaoGestor?: string) => Promise<void>;
  updateDemand: (id: string, payload: DemandUpdatePayload) => Promise<void>;
  deleteDemand: (id: string) => Promise<void>;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
}

export const useDemandStore = create<DemandState>((set, get) => ({
  demands: [],
  bairros: [],
  loading: false,
  filters: {},
  async fetchDemands(filters = {}) {
    set({ loading: true, error: undefined, filters });
    try {
      const data = await demandService.getAll(filters);
      set({ demands: data, bairros: mergeBairros(get().bairros, data), loading: false });
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
      demands: get().demands.map((d) => (d.id === id ? (updated ?? d) : d)),
      selected: updated ?? get().selected,
      loading: false,
    });
  },
  async updateDemand(id, payload) {
    set({ loading: true, error: undefined });
    try {
      const updated = await demandService.update(id, payload);
      set({
        demands: get().demands.map((d) => (d.id === id ? updated : d)),
        selected: updated,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  async deleteDemand(id) {
    set({ loading: true, error: undefined });
    try {
      await demandService.remove(id);
      set({
        demands: get().demands.filter((d) => d.id !== id),
        selected: get().selected?.id === id ? undefined : get().selected,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  setFilters(filters) {
    set({ filters });
  },
  clearFilters() {
    set({ filters: {} });
  },
}));
