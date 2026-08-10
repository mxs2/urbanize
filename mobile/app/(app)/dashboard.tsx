import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useDemandStore } from "@/store/demandStore";
import { useMetrics } from "@/hooks/useMetrics";
import { colors, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { MetricsCard } from "@/components/MetricsCard";
import { DemandCard } from "@/components/DemandCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { SectionTitle } from "@/components/SectionTitle";

export default function Dashboard() {
  const { ready, user } = useRoleGuard(["cidadao"]);
  const { demands, fetchDemands } = useDemandStore();
  const { metrics, loading: metricsLoading } = useMetrics();

  useEffect(() => {
    if (ready) fetchDemands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready || !user) return <LoadingState />;

  const myDemands = demands.filter((d) => d.emailSolicitante === user.email);
  const resolvidas = myDemands.filter((d) => d.status === "resolvida").length;
  const emAtendimento = myDemands.filter((d) => d.status === "em_atendimento").length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionTitle title={`Olá, ${user.nome}`} subtitle="Acompanhe suas demandas urbanas" />

      {metricsLoading ? (
        <LoadingState />
      ) : (
        <View style={styles.metricsRow}>
          <MetricsCard label="Total" value={myDemands.length} />
          <MetricsCard label="Em atendimento" value={emAtendimento} accentColor={colors.brand[500]} />
          <MetricsCard label="Resolvidas" value={resolvidas} accentColor={colors.success} />
          <MetricsCard
            label="Tempo médio"
            value={`${metrics?.tempoMedioAtendimentoDias ?? 0}d`}
            accentColor={colors.warning}
          />
        </View>
      )}

      <SectionTitle title="Últimas demandas" />
      {myDemands.length === 0 ? (
        <EmptyState
          message="Você ainda não registrou nenhuma demanda."
          actionLabel="Nova demanda"
          onAction={() => router.push("/demandas/nova")}
        />
      ) : (
        myDemands.slice(0, 4).map((demand) => <DemandCard key={demand.id} demand={demand} />)
      )}

      <View style={styles.actions}>
        <Button label="Nova demanda" onPress={() => router.push("/demandas/nova")} />
        <Button label="Ver todas" variant="outline" onPress={() => router.push("/demandas")} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
});
