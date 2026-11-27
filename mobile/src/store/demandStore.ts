import { create } from "zustand";
import { isOfflineError } from "@/services/api";
import { demandCache } from "@/services/demandCache";
import { demandService } from "@/services/demandService";
import { notifications } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";
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
  /** Preenchido quando a tela mostra dados do cache local por falta de conexão. */
  offlineSince?: string;
  filters: FilterState;
  fetchDemands: (filters?: FilterState) => Promise<void>;
  fetchDemandById: (id: string) => Promise<void>;
  /** Atualiza em segundo plano, sem indicador de carregamento; usado para detectar mudanças de status. */
  syncInBackground: () => Promise<void>;
  createDemand: (payload: NewDemandInput) => Promise<Demand>;
  updateDemandStatus: (id: string, status: Demand["status"], observacaoGestor?: string) => Promise<void>;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
  reset: () => void;
}

const currentUserId = () => useAuthStore.getState().user?.id;

/** Salva no cache e avisa o cidadão das demandas que mudaram de status desde a última vez. */
const persist = async (demands: Demand[]) => {
  const user = useAuthStore.getState().user;
  if (!user) return;
  const changed = await demandCache.save(user.id, demands);
  if (user.role === "cidadao") await notifications.notifyStatusChanges(changed);
};

const initialState = {
  demands: [],
  bairros: [],
  selected: undefined,
  loading: false,
  saving: false,
  error: undefined,
  offlineSince: undefined,
  filters: {},
};

export const useDemandStore = create<DemandState>((set, get) => ({
  ...initialState,
  async fetchDemands(filters = {}) {
    set({ loading: true, error: undefined, filters });
    try {
      const data = await demandService.getAll(filters);
      set({ demands: data, bairros: mergeBairros(get().bairros, data), loading: false, offlineSince: undefined });
      await persist(data);
    } catch (error) {
      const userId = currentUserId();
      const cached = isOfflineError(error) && userId ? await demandCache.list(userId, filters) : null;
      if (cached) {
        set({
          demands: cached.demands,
          bairros: mergeBairros(get().bairros, cached.demands),
          offlineSince: cached.savedAt,
          loading: false,
        });
        return;
      }
      set({ error: errorMessage(error, "Erro ao carregar demandas"), loading: false });
    }
  },
  async fetchDemandById(id) {
    // Descarta o detalhe anterior para não mostrar outra demanda enquanto esta carrega.
    if (get().selected?.id !== id) set({ selected: undefined });
    set({ loading: true, error: undefined });
    try {
      const demand = await demandService.getById(id);
      set({ selected: demand, loading: false, offlineSince: undefined });
      await persist([demand]);
    } catch (error) {
      const userId = currentUserId();
      const cached = isOfflineError(error) && userId ? await demandCache.get(userId, id) : null;
      if (cached) {
        set({ selected: cached.demand, offlineSince: cached.savedAt, loading: false });
        return;
      }
      set({ error: errorMessage(error, "Erro ao carregar demanda"), loading: false });
    }
  },
  async syncInBackground() {
    if (get().loading || !currentUserId()) return;
    try {
      const latest = await demandService.getAll({});
      const byId = new Map(latest.map((d) => [d.id, d]));
      const { demands, selected } = get();
      set({
        demands: demands.map((d) => byId.get(d.id) ?? d),
        selected: selected ? (byId.get(selected.id) ?? selected) : selected,
        offlineSince: undefined,
      });
      await persist(latest);
    } catch {
      // Sincronização silenciosa: sem rede, tenta de novo no próximo ciclo.
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
  reset() {
    set(initialState);
  },
}));

// Troca de usuário (logout, sessão expirada, outro login): nada da conta anterior fica na tela.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) useDemandStore.getState().reset();
});
