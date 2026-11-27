import { Pressable, StyleSheet, Text, View } from "react-native";
import { useOtaUpdate } from "@/hooks/useOtaUpdate";
import { colors, spacing } from "@/theme";

/** Faixa no topo quando uma atualização OTA já foi baixada. */
export function UpdateBanner() {
  const { ready, apply } = useOtaUpdate();
  if (!ready) return null;

  return (
    <View style={styles.container} role="status">
      <Text style={styles.text}>Nova versão do app disponível.</Text>
      <Pressable onPress={apply} hitSlop={8}>
        <Text style={styles.action}>Reiniciar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.brand[700],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { color: "#fff", fontSize: 13 },
  action: { color: "#fff", fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
});
