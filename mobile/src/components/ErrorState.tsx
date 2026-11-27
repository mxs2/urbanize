import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme";
import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorState({ message, onRetry, testID }: ErrorStateProps) {
  return (
    <View testID={testID} style={styles.container} role="alert">
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <Button label="Tentar novamente" variant="outline" onPress={onRetry} /> : null}
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
    gap: spacing.sm,
  },
  text: { color: colors.danger, fontWeight: "500" },
});
