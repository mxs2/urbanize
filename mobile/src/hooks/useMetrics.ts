import { useEffect, useState } from "react";
import { metricsService } from "@/services/metricsService";
import { MetricsSummary } from "@/types/metrics";

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    metricsService
      .summary()
      .then(setMetrics)
      .catch(() => setError("Erro ao carregar métricas"))
      .finally(() => setLoading(false));
  }, []);

  return { metrics, loading, error };
};
