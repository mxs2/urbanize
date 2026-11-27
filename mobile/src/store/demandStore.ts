import { create } from "zustand";
import { demandService } from "@/services/demandService";
import { Demand, FilterState, NewDemandInput } from "@/types/demand";
import { errorMessage } from "@/utils/errorMessage";

const mergeBairros = (current: string[], demands: Demand[]) =>
  Array.from(new Set([...current, ...demands.map((d) => d.endereco.bairro).filter(Boolean)])).sort((a, b) =>
    a.localeCompare(b)
  );

interface DemandState {
  demands: Demand[];
  bairros: string[];
  selected?: Demand;
  /** Carregando lista ou detalhe. */
  loading: boolean;
  /** Enviando criação ou mudança de status; não esconde a tela atual. */
  saving: boolean;
  error?: string;
  filters: FilterState;
  fetchDemands: (filters?: FilterState) => Promise<void>;
  fetchDemandById: (id: string) => Promise<void>;
  createDemand: (payload: NewDemandInput) => Promise<Demand>;
  updateDemandStatus: (id: string, status: Demand["status"], observacaoGestor?: string) => Promise<void>;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
}

export const useDemandStore = create<DemandState>((set, get) => ({
  demands: [],
  bairros: [],
  loading: false,
  saving: false,
  filters: {},
  async fetchDemands(filters = {}) {
    set({ loading: true, error: undefined, filters });
    try {
      const data = await demandService.getAll(filters);
      set({ demands: data, bairros: mergeBairros(get().bairros, data), loading: false });
    } catch (error) {
      set({ error: errorMessage(error, "Erro ao carregar demandas"), loading: false });
    }
  },
  async fetchDemandById(id) {
    // Descarta o detalhe anterior para não mostrar outra demanda enquanto esta carrega.
    if (get().selected?.id !== id) set({ selected: undefined });
    set({ loading: true, error: undefined });
    try {
      const demand = await demandService.getById(id);
      set({ selected: demand, loading: false });
    } catch (error) {
      set({ error: errorMessage(error, "Erro ao carregar demanda"), loading: false });
    }
  },
  async createDemand(payload) {
    set({ saving: true });
    try {
      const created = await demandService.create(payload);
      set({ demands: [created, ...get().demands] });
      return created;
    } finally {
      set({ saving: false });
    }
  },
  async updateDemandStatus(id, status, observacaoGestor) {
    set({ saving: true });
    try {
      const updated = await demandService.updateStatus(id, status, observacaoGestor);
      set({
        demands: get().demands.map((d) => (d.id === id ? updated : d)),
        selected: get().selected?.id === id ? updated : get().selected,
      });
    } finally {
      set({ saving: false });
    }
  },
  setFilters(filters) {
    set({ filters });
  },
  clearFilters() {
    set({ filters: {} });
  },
}));
