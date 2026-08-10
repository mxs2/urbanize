export interface MetricsSummary {
  total: number;
  porStatus: Record<string, number>;
  porCategoria: Record<string, number>;
  tempoMedioAtendimentoDias: number;
}
