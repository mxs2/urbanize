import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useDemands } from "@/hooks/useDemands";
import { colors } from "@/theme";
import { Button } from "@/components/Button";
import { DemandCard } from "@/components/DemandCard";
import { DemandFilters } from "@/components/DemandFilters";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SectionTitle } from "@/components/SectionTitle";

export default function DemandasList() {
  const { ready, user } = useRoleGuard(["cidadao", "gestor"]);
  const { demands, loading, error, filters, fetchDemands, offlineSince } = useDemands(ready);
  const refresh = () => fetchDemands(filters);

  if (!ready || !user) return <LoadingState />;

  const isCidadao = user.role === "cidadao";

  return (
    <FlatList
      contentContainerClassName="p-6 pb-10"
      data={loading || error ? [] : demands}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={loading && demands.length > 0} onRefresh={refresh} tintColor={colors.brand[500]} />
      }
      renderItem={({ item }) => <DemandCard demand={item} />}
      ListHeaderComponent={
        <View className="mb-2">
          <SectionTitle
            title={isCidadao ? "Minhas Demandas" : "Todas as Demandas"}
            subtitle={isCidadao ? "Acompanhe o status das demandas que você registrou" : "Fila geral de demandas urbanas"}
            action={
              isCidadao ? (
                <Button label="Nova" icon="add" size="sm" onPress={() => router.push("/demandas/nova")} />
              ) : null
            }
          />
          <OfflineBanner since={offlineSince} />
          <DemandFilters />
          {loading ? <LoadingState /> : null}
          {error ? <ErrorState testID="erro-listagem" message={error} onRetry={refresh} /> : null}
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <EmptyState
            message="Nenhuma demanda encontrada."
            actionLabel={isCidadao ? "Criar demanda" : undefined}
            onAction={isCidadao ? () => router.push("/demandas/nova") : undefined}
          />
        ) : undefined
      }
    />
  );
}
