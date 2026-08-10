import { StyleSheet, Text, View } from "react-native";
import { DemandHistoryItem } from "@/types/demand";
import { formatDate } from "@/utils/formatDate";
import { colors, spacing } from "@/theme";
import { Badge } from "./Badge";
import { statusColor, statusLabel } from "@/utils/statusLabel";

export function DemandTimeline({ historico }: { historico: DemandHistoryItem[] }) {
  return (
    <View style={styles.container}>
      {historico.map((item) => (
        <View key={item.id} style={styles.item}>
          <Badge label={statusLabel[item.status]} color={statusColor[item.status]} />
          <Text style={styles.descricao}>{item.descricao.replace(/\s*\|\s*Contatos:.*$/i, "")}</Text>
          <Text style={styles.meta}>
            {formatDate(item.data)} · {item.autor}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  item: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
    gap: spacing.xs,
  },
  descricao: { fontSize: 13, color: colors.text },
  meta: { fontSize: 11, color: colors.textMuted },
});
