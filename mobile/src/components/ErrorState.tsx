import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme";

export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${colors.danger}15`,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  text: { color: colors.danger, fontWeight: "500" },
});
