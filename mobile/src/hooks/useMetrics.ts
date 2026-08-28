import { useCallback, useEffect, useState } from "react";
import { metricsService } from "@/services/metricsService";
import { MetricsSummary } from "@/types/metrics";

export const useMetrics = (auto = true) => {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setMetrics(await metricsService.summary());
      setError(undefined);
    } catch {
      setError("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auto) refetch();
  }, [auto, refetch]);

  return { metrics, loading, error, refetch };
};
