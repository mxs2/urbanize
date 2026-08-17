import { FlatList, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useDemands } from "@/hooks/useDemands";
import { spacing } from "@/theme";
import { Button } from "@/components/Button";
import { DemandCard } from "@/components/DemandCard";
import { DemandFilters } from "@/components/DemandFilters";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { SectionTitle } from "@/components/SectionTitle";

export default function DemandasList() {
  const { ready, user } = useRoleGuard(["cidadao", "gestor"]);
  const { demands, loading, error } = useDemands(ready);

  if (!ready || !user) return <LoadingState />;

  const isCidadao = user.role === "cidadao";

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={loading || error ? [] : demands}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <DemandCard demand={item} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <SectionTitle
            title={isCidadao ? "Minhas Demandas" : "Todas as Demandas"}
            subtitle={
              isCidadao
                ? "Acompanhe o status das demandas que você registrou"
                : "Fila geral de demandas urbanas"
            }
          />
          {isCidadao ? <Button label="Nova demanda" onPress={() => router.push("/demandas/nova")} /> : null}
          <DemandFilters />
          {loading ? <LoadingState /> : null}
          {error ? <ErrorState message={error} /> : null}
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <EmptyState
            message="Nenhuma demanda encontrada."
            actionLabel={isCidadao ? "Criar demanda" : undefined}
            onAction={isCidadao ? () => router.push("/demandas/nova") : undefined}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
});
