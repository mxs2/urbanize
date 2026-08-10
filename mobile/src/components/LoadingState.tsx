import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors, spacing } from "@/theme";

export function LoadingState() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.brand[500]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, alignItems: "center", justifyContent: "center" },
});
