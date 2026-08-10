import { api } from "./api";
import { MetricsSummary } from "@/types/metrics";

export const metricsService = {
  summary: (): Promise<MetricsSummary> => api.getMetrics(),
};
