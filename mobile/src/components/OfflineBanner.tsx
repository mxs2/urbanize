import { StyleSheet, Text, View } from "react-native";
import { formatDate } from "@/utils/formatDate";
import { colors, radii, spacing } from "@/theme";

/** Aviso de que a tela mostra o cache local porque a API não respondeu. */
export function OfflineBanner({ since }: { since?: string }) {
  if (!since) return null;
  return (
    <View testID="banner-offline" style={styles.container} role="status">
      <Text style={styles.title}>Sem conexão</Text>
      <Text style={styles.text}>Mostrando dados salvos no aparelho em {formatDate(since)}.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${colors.warning}22`,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 2,
  },
  title: { fontWeight: "700", color: colors.text, fontSize: 13 },
  text: { color: colors.text, fontSize: 12 },
});
