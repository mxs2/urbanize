import AsyncStorage from "@react-native-async-storage/async-storage";
import { Demand, FilterState } from "@/types/demand";

/**
 * Cache local das demandas já consultadas, para o app abrir sem rede.
 *
 * Fica no AsyncStorage (não no cofre): são dados que o próprio usuário já viu, e o
 * cache é separado por usuário e apagado no logout. O token continua só no SecureStore.
 */
const KEY_PREFIX = "urbanize-cache:demands:";
const MAX_ENTRIES = 300;

export interface CachedDemands {
  savedAt: string;
  demands: Demand[];
}

interface StoredCache {
  savedAt: string;
  byId: Record<string, Demand>;
}

const keyFor = (userId: string) => `${KEY_PREFIX}${userId}`;

const read = async (userId: string): Promise<StoredCache | null> => {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as StoredCache) : null;
  } catch {
    return null;
  }
};

const byNewest = (a: Demand, b: Demand) => b.criadaEm.localeCompare(a.criadaEm);

/** Mesmos filtros que o backend aplica em GET /demands, para a lista offline bater com a online. */
export const applyFilters = (demands: Demand[], filters: FilterState) => {
  const busca = filters.busca?.trim().toLowerCase();
  return demands.filter(
    (d) =>
      (!filters.status || d.status === filters.status) &&
      (!filters.categoria || d.categoria === filters.categoria) &&
      (!filters.prioridade || d.prioridade === filters.prioridade) &&
      (!filters.bairro || d.endereco.bairro === filters.bairro) &&
      (!busca ||
        [d.titulo, d.descricao, d.protocolo].some((field) => field.toLowerCase().includes(busca)))
  );
};

export const demandCache = {
  /**
   * Junta as demandas recebidas às que já estavam salvas (a lista pode vir filtrada).
   * Devolve as que já estavam no cache com outro status, para o app avisar o cidadão.
   */
  async save(userId: string, demands: Demand[]): Promise<Demand[]> {
    const current = (await read(userId))?.byId ?? {};
    const changed = demands.filter((d) => current[d.id] && current[d.id].status !== d.status);
    for (const demand of demands) current[demand.id] = demand;
    const kept = Object.values(current).sort(byNewest).slice(0, MAX_ENTRIES);
    const next: StoredCache = {
      savedAt: new Date().toISOString(),
      byId: Object.fromEntries(kept.map((d) => [d.id, d])),
    };
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next)).catch(() => undefined);
    return changed;
  },

  async list(userId: string, filters: FilterState = {}): Promise<CachedDemands | null> {
    const cache = await read(userId);
    if (!cache) return null;
    return { savedAt: cache.savedAt, demands: applyFilters(Object.values(cache.byId).sort(byNewest), filters) };
  },

  async get(userId: string, id: string): Promise<{ savedAt: string; demand: Demand } | null> {
    const cache = await read(userId);
    const demand = cache?.byId[id];
    return cache && demand ? { savedAt: cache.savedAt, demand } : null;
  },

  async clear(userId: string) {
    await AsyncStorage.removeItem(keyFor(userId)).catch(() => undefined);
  },
};
