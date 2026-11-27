import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Demand } from "@/types/demand";
import { categoryLabel } from "@/utils/categoryLabel";
import { formatDate } from "@/utils/formatDate";
import { formatLocation } from "@/utils/locationLabel";
import { colors } from "@/theme";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

export function DemandCard({ demand }: { demand: Demand }) {
  return (
    <Pressable
      testID={`card-demanda-${demand.protocolo}`}
      role="link"
      onPress={() => router.push(`/demandas/${demand.id}`)}
      className="mb-3 gap-2 rounded-lg border border-line bg-surface p-4 active:border-brand-300 active:bg-brand-50/40"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold tracking-wide text-ink-muted">{demand.protocolo}</Text>
        <PriorityBadge priority={demand.prioridade} />
      </View>
      <Text className="text-base font-bold text-ink">{demand.titulo}</Text>
      <Text className="text-[13px] text-ink-muted" numberOfLines={2}>
        {demand.descricao}
      </Text>
      <View className="flex-row items-center gap-1">
        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
        <Text className="flex-1 text-xs text-ink-muted" numberOfLines={1}>
          {formatLocation(demand.endereco)}
        </Text>
      </View>
      <View className="mt-1 flex-row items-center justify-between border-t border-line pt-3">
        <StatusBadge status={demand.status} />
        <Text className="text-xs text-ink-muted">
          {categoryLabel[demand.categoria]} · {formatDate(demand.criadaEm)}
        </Text>
      </View>
    </Pressable>
  );
}
