import { StyleSheet, Text, View } from "react-native";
import { colors, fontSizes, spacing } from "@/theme";

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  title: { fontSize: fontSizes.lg, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: fontSizes.sm, color: colors.textMuted, marginTop: 2 },
});
