import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Demand } from "@/types/demand";
import { categoryLabel } from "@/utils/categoryLabel";
import { formatDate } from "@/utils/formatDate";
import { formatLocation } from "@/utils/locationLabel";
import { colors, radii, spacing } from "@/theme";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

export function DemandCard({ demand }: { demand: Demand }) {
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/demandas/${demand.id}`)}>
      <View style={styles.headerRow}>
        <Text style={styles.protocolo}>{demand.protocolo}</Text>
        <PriorityBadge priority={demand.prioridade} />
      </View>
      <Text style={styles.titulo}>{demand.titulo}</Text>
      <Text style={styles.descricao} numberOfLines={2}>
        {demand.descricao}
      </Text>
      <Text style={styles.meta}>
        {formatLocation(demand.endereco)} · {categoryLabel[demand.categoria]} · {formatDate(demand.criadaEm)}
      </Text>
      <View style={styles.footerRow}>
        <StatusBadge status={demand.status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  protocolo: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  titulo: { fontSize: 16, fontWeight: "700", color: colors.text },
  descricao: { fontSize: 13, color: colors.textMuted },
  meta: { fontSize: 12, color: colors.textMuted },
  footerRow: { marginTop: spacing.xs, flexDirection: "row" },
});
