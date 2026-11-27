import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useDemandStore } from "@/store/demandStore";
import { useMetrics } from "@/hooks/useMetrics";
import { colors } from "@/theme";
import { DemandCard } from "@/components/DemandCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { MetricsCard } from "@/components/MetricsCard";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SectionTitle } from "@/components/SectionTitle";

export default function Dashboard() {
  const { ready, user } = useRoleGuard(["cidadao"]);
  const { demands, loading, error, offlineSince, fetchDemands } = useDemandStore();
  const { metrics } = useMetrics(ready);

  useEffect(() => {
    if (ready) fetchDemands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready || !user) return <LoadingState />;

  // A API já devolve só as demandas da conta; o contato pode ter sido anonimizado (RS20).
  const myDemands = demands;
  const resolvidas = myDemands.filter((d) => d.status === "resolvida").length;
  const emAndamento = myDemands.filter((d) => !["resolvida", "cancelada"].includes(d.status)).length;
  const primeiroNome = user.nome.split(" ")[0];

  return (
    <ScrollView contentContainerClassName="gap-4 p-6 pb-10">
      <View>
        <Text className="text-sm text-ink-muted">Olá,</Text>
        <Text role="heading" className="text-2xl font-bold text-ink">
          {primeiroNome}
        </Text>
      </View>

      <OfflineBanner since={offlineSince} />

      <Pressable
        testID="cta-nova-demanda"
        role="button"
        onPress={() => router.push("/demandas/nova")}
        className="flex-row items-center gap-4 rounded-lg bg-brand-500 p-5 active:bg-brand-600"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <Ionicons name="camera" size={24} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-white">Registrar um problema</Text>
          <Text className="text-[13px] text-brand-100">Foto, localização e pronto: a prefeitura recebe.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </Pressable>

      <View className="flex-row flex-wrap gap-3">
        <MetricsCard label="Registradas" value={myDemands.length} icon="documents-outline" />
        <MetricsCard label="Em andamento" value={emAndamento} icon="time-outline" accentColor={colors.warning} />
        <MetricsCard label="Resolvidas" value={resolvidas} icon="checkmark-done-outline" accentColor={colors.success} />
        <MetricsCard
          label="Tempo médio"
          value={`${metrics?.tempoMedioAtendimentoDias ?? 0}d`}
          icon="hourglass-outline"
          accentColor={colors.brand[700]}
        />
      </View>

      <SectionTitle
        title="Últimas demandas"
        action={
          myDemands.length > 0 ? (
            <Pressable onPress={() => router.push("/demandas")} hitSlop={8}>
              <Text className="text-sm font-semibold text-brand-600">Ver todas</Text>
            </Pressable>
          ) : null
        }
      />
      {error ? <ErrorState message={error} onRetry={() => fetchDemands()} /> : null}
      {loading && myDemands.length === 0 ? <LoadingState /> : null}
      {!loading && myDemands.length === 0 && !error ? (
        <EmptyState
          message="Você ainda não registrou nenhuma demanda."
          actionLabel="Nova demanda"
          onAction={() => router.push("/demandas/nova")}
        />
      ) : (
        <View>
          {myDemands.slice(0, 4).map((demand) => (
            <DemandCard key={demand.id} demand={demand} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
