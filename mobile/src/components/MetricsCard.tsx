import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme";

interface MetricsCardProps {
  label: string;
  value: string | number;
  helpText?: string;
  accentColor?: string;
}

export function MetricsCard({ label, value, helpText, accentColor = colors.brand[500] }: MetricsCardProps) {
  return (
    <View style={[styles.card, { borderTopColor: accentColor }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helpText ? <Text style={styles.helpText}>{helpText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderTopWidth: 3,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, color: colors.textMuted },
  value: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: spacing.xs },
  helpText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
});
