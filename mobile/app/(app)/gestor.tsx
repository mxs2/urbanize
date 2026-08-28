import { useEffect, useMemo } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useMetrics } from "@/hooks/useMetrics";
import { useDemandStore } from "@/store/demandStore";
import { DemandCategory, DemandStatus } from "@/types/demand";
import { categoryLabel } from "@/utils/categoryLabel";
import { statusLabel } from "@/utils/statusLabel";
import { colors, radii, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { DemandCard } from "@/components/DemandCard";
import { MetricsCard } from "@/components/MetricsCard";
import { SectionTitle } from "@/components/SectionTitle";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Select } from "@/components/Select";

const QUEUE_STATUSES: DemandStatus[] = ["registrada", "em_analise"];

const apiOrigin = (process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:4000/api").replace(/\/api\/?$/, "");

const resolveImageUrl = (imagemUrl?: string) => {
  if (!imagemUrl) return undefined;
  return imagemUrl.startsWith("http") ? imagemUrl : `${apiOrigin}${imagemUrl}`;
};

export default function GestorPanel() {
  const { ready, user } = useRoleGuard(["gestor"]);
  const { demands, filters, setFilters, fetchDemands, updateDemandStatus } = useDemandStore();
  const {
    metrics,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useMetrics(ready);

  useEffect(() => {
    if (ready) fetchDemands({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const triagemQueue = useMemo(
    () =>
      demands.filter((d) => QUEUE_STATUSES.includes(d.status) && (d.imagemUrl || d.sugestaoEncaminhamento)),
    [demands]
  );

  if (!ready || !user) return <LoadingState />;

  const porStatus = metrics?.porStatus ?? {};
  const statusCount = (status: DemandStatus) => porStatus[status] ?? 0;
  const porCategoria = Object.entries(metrics?.porCategoria ?? {}).sort((a, b) => b[1] - a[1]);

  const handleAccept = async (id: string, sugestao?: string) => {
    try {
      await updateDemandStatus(id, "encaminhada", sugestao ?? "Aceito triagem");
      await refetchMetrics();
      Alert.alert("Triagem aceita", "Demanda encaminhada.");
    } catch {
      Alert.alert("Erro", "Não foi possível aceitar a triagem.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionTitle title="Painel do gestor" subtitle={`Olá, ${user.nome}`} />

      {metricsLoading ? <LoadingState /> : null}
      {metricsError ? (
        <View style={styles.metricsError}>
          <ErrorState message={metricsError} />
          <Button label="Tentar novamente" variant="outline" onPress={refetchMetrics} />
        </View>
      ) : null}
      {metrics ? (
        <>
          <View style={styles.metricsRow}>
            <MetricsCard label="Total" value={metrics.total} />
            <MetricsCard label="Em análise" value={statusCount("em_analise")} accentColor={colors.warning} />
            <MetricsCard
              label="Encaminhadas"
              value={statusCount("encaminhada")}
              accentColor={colors.brand[500]}
            />
            <MetricsCard
              label="Em atendimento"
              value={statusCount("em_atendimento")}
              accentColor={colors.success}
            />
            <MetricsCard label="Resolvidas" value={statusCount("resolvida")} accentColor={colors.success} />
            <MetricsCard
              label="Tempo médio"
              value={`${metrics.tempoMedioAtendimentoDias}d`}
              helpText="Média de atendimento das demandas resolvidas"
              accentColor={colors.warning}
            />
          </View>

          <SectionTitle title="Demandas por categoria" />
          {porCategoria.length === 0 ? (
            <Text style={styles.empty}>Nenhuma demanda registrada.</Text>
          ) : (
            <View style={styles.categoryList}>
              {porCategoria.map(([categoria, total]) => (
                <View key={categoria} style={styles.categoryRow}>
                  <Text style={styles.categoryLabel}>
                    {categoryLabel[categoria as DemandCategory] ?? categoria}
                  </Text>
                  <Text style={styles.categoryValue}>{total}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}

      <SectionTitle
        title="Triagem Inteligente"
        subtitle="Demandas com classificação automática pendente de revisão"
      />
      {triagemQueue.length === 0 ? (
        <Text style={styles.empty}>Nenhuma demanda pendente de triagem.</Text>
      ) : (
        triagemQueue.map((demand) => {
          const imageUri = resolveImageUrl(demand.imagemUrl);
          const score = Math.round((demand.scoreTriagem ?? 0.7) * 100);
          return (
            <View key={demand.id} style={styles.triagemCard}>
              {imageUri ? <Image source={{ uri: imageUri }} style={styles.triagemImage} /> : null}
              <View style={styles.triagemInfo}>
                <Text style={styles.triagemProtocolo}>{demand.protocolo}</Text>
                <Text style={styles.triagemTitulo}>{demand.titulo}</Text>
                <Text style={styles.triagemDescricao} numberOfLines={2}>
                  {demand.descricao}
                </Text>
                {demand.sugestaoEncaminhamento ? (
                  <Text style={styles.triagemSugestao}>
                    Sugestão: {demand.sugestaoEncaminhamento} ({score}% confiança)
                  </Text>
                ) : null}
                <View style={styles.triagemActions}>
                  <Button
                    label="Aceitar"
                    onPress={() => handleAccept(demand.id, demand.sugestaoEncaminhamento)}
                  />
                  <Button
                    label="Revisar"
                    variant="outline"
                    onPress={() => router.push(`/demandas/${demand.id}`)}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}

      <SectionTitle title="Fila recente" />
      <Select
        label="Status"
        value={filters.status ?? ""}
        options={[
          { label: "Todos", value: "" },
          ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
        ]}
        onChange={(value) => {
          const status = (value || undefined) as DemandStatus | undefined;
          setFilters({ status });
          fetchDemands({ status });
        }}
      />
      {demands.slice(0, 5).map((demand) => (
        <DemandCard key={demand.id} demand={demand} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  metricsError: { gap: spacing.sm, marginBottom: spacing.md },
  categoryList: { marginBottom: spacing.lg },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryLabel: { fontSize: 13, color: colors.text },
  categoryValue: { fontSize: 13, fontWeight: "700", color: colors.text },
  triagemCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  triagemImage: { width: 72, height: 72, borderRadius: radii.sm, backgroundColor: colors.border },
  triagemInfo: { flex: 1, gap: 2 },
  triagemProtocolo: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  triagemTitulo: { fontSize: 14, fontWeight: "700", color: colors.text },
  triagemDescricao: { fontSize: 12, color: colors.textMuted },
  triagemSugestao: { fontSize: 12, color: colors.brand[600], fontWeight: "600" },
  triagemActions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
});
