import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useMetrics } from "@/hooks/useMetrics";
import { useDemandStore } from "@/store/demandStore";
import { resolveImageUrl } from "@/services/api";
import { DemandStatus } from "@/types/demand";
import { statusLabel } from "@/utils/statusLabel";
import { errorMessage } from "@/utils/errorMessage";
import { colors } from "@/theme";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { DemandCard } from "@/components/DemandCard";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { MetricsCard } from "@/components/MetricsCard";
import { SectionTitle } from "@/components/SectionTitle";
import { Select } from "@/components/Select";

const QUEUE_STATUSES: DemandStatus[] = ["registrada", "em_analise"];

const statusOptions = [
  { label: "Todos", value: "" },
  ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
];

export default function GestorPanel() {
  const { ready, user } = useRoleGuard(["gestor"]);
  const { demands, filters, setFilters, fetchDemands, updateDemandStatus } = useDemandStore();
  const { metrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useMetrics(ready);
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    if (ready) fetchDemands({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const triagemQueue = useMemo(
    () => demands.filter((d) => QUEUE_STATUSES.includes(d.status) && (d.imagemUrl || d.sugestaoEncaminhamento)),
    [demands]
  );

  if (!ready || !user) return <LoadingState />;

  const statusCount = (status: DemandStatus) => metrics?.porStatus[status] ?? 0;

  const handleAccept = async (id: string, sugestao?: string) => {
    setActionError(undefined);
    try {
      await updateDemandStatus(id, "encaminhada", sugestao ?? "Aceito triagem");
      await refetchMetrics();
    } catch (error) {
      setActionError(errorMessage(error, "Não foi possível aceitar a triagem."));
    }
  };

  return (
    <ScrollView contentContainerClassName="gap-4 p-6 pb-10">
      <SectionTitle title="Painel do gestor" subtitle={`Olá, ${user.nome}`} />

      {metricsLoading && !metrics ? <LoadingState label="Carregando indicadores…" /> : null}
      {metricsError ? <ErrorState message={metricsError} onRetry={refetchMetrics} /> : null}
      {metrics ? (
        <>
          <View className="flex-row flex-wrap gap-3">
            <MetricsCard label="Total" value={metrics.total} icon="documents-outline" />
            <MetricsCard
              testID="metrica-em-analise"
              label="Em análise"
              value={statusCount("em_analise")}
              icon="search-outline"
              accentColor={colors.warning}
            />
            <MetricsCard
              testID="metrica-encaminhadas"
              label="Encaminhadas"
              value={statusCount("encaminhada")}
              icon="arrow-redo-outline"
              accentColor={colors.brand[500]}
            />
            <MetricsCard
              label="Em atendimento"
              value={statusCount("em_atendimento")}
              icon="construct-outline"
              accentColor={colors.brand[700]}
            />
            <MetricsCard
              label="Resolvidas"
              value={statusCount("resolvida")}
              icon="checkmark-done-outline"
              accentColor={colors.success}
            />
            <MetricsCard
              label="Tempo médio"
              value={`${metrics.tempoMedioAtendimentoDias}d`}
              helpText="Das demandas resolvidas"
              icon="hourglass-outline"
              accentColor={colors.brand[700]}
            />
          </View>

          <Card>
            <SectionTitle title="Demandas por categoria" subtitle={`${metrics.total} no total`} />
            <CategoryBreakdown data={metrics.porCategoria} />
          </Card>
        </>
      ) : null}

      <SectionTitle title="Triagem Inteligente" subtitle="Classificação automática pendente de revisão" />
      {actionError ? <ErrorState message={actionError} /> : null}
      {triagemQueue.length === 0 ? (
        <Text className="text-sm text-ink-muted">Nenhuma demanda pendente de triagem.</Text>
      ) : (
        triagemQueue.map((demand) => {
          const imageUri = resolveImageUrl(demand.imagemUrl);
          const score = Math.round((demand.scoreTriagem ?? 0.7) * 100);
          return (
            <Card key={demand.id} testID={`triagem-${demand.protocolo}`} className="flex-row gap-3 p-3">
              {imageUri ? (
                <Image source={{ uri: imageUri }} className="h-20 w-20 rounded-md bg-line" />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-md bg-brand-50">
                  <Ionicons name="image-outline" size={24} color={colors.brand[300]} />
                </View>
              )}
              <View className="flex-1 gap-1">
                <Text className="text-[11px] font-semibold text-ink-muted">{demand.protocolo}</Text>
                <Text className="text-sm font-bold text-ink">{demand.titulo}</Text>
                {demand.sugestaoEncaminhamento ? (
                  <Text className="text-xs font-semibold text-brand-600">
                    Sugestão: {demand.sugestaoEncaminhamento} ({score}% confiança)
                  </Text>
                ) : null}
                <View className="mt-1 flex-row gap-2">
                  <Button
                    size="sm"
                    icon="checkmark"
                    testID={`btn-aceitar-${demand.protocolo}`}
                    label="Aceitar"
                    onPress={() => handleAccept(demand.id, demand.sugestaoEncaminhamento)}
                  />
                  <Button
                    size="sm"
                    testID={`btn-revisar-${demand.protocolo}`}
                    label="Revisar"
                    variant="outline"
                    onPress={() => router.push(`/demandas/${demand.id}`)}
                  />
                </View>
              </View>
            </Card>
          );
        })
      )}

      <SectionTitle title="Fila recente" />
      <Select
        testID="fila-status"
        label="Status"
        value={filters.status ?? ""}
        options={statusOptions}
        onChange={(value) => {
          const status = (value || undefined) as DemandStatus | undefined;
          setFilters({ status });
          fetchDemands({ status });
        }}
      />
      <View>
        {demands.slice(0, 5).map((demand) => (
          <DemandCard key={demand.id} demand={demand} />
        ))}
      </View>
    </ScrollView>
  );
}
