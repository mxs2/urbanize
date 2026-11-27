import { useEffect } from "react";
import { useMetricsStore } from "@/store/metricsStore";

export const useMetrics = (auto = true) => {
  const { metrics, loading, error, fetchMetrics } = useMetricsStore();

  useEffect(() => {
    if (auto) fetchMetrics();
  }, [auto, fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
};
