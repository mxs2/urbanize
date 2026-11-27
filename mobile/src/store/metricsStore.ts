import { create } from "zustand";
import { metricsService } from "@/services/metricsService";
import { MetricsSummary } from "@/types/metrics";

interface MetricsState {
  metrics: MetricsSummary | null;
  loading: boolean;
  error?: string;
  fetchMetrics: () => Promise<void>;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  metrics: null,
  loading: false,
  async fetchMetrics() {
    set({ loading: true, error: undefined });
    try {
      set({ metrics: await metricsService.summary(), loading: false });
    } catch {
      set({ error: "Erro ao carregar métricas", loading: false });
    }
  },
}));
