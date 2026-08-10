import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing } from "@/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "solid" | "outline" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = "solid", disabled, loading }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === "solid" && styles.solid,
        variant === "outline" && styles.outline,
        variant === "ghost" && styles.ghost,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "solid" ? "#fff" : colors.brand[500]} />
      ) : (
        <Text style={[styles.label, variant !== "solid" && { color: colors.brand[500] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: { backgroundColor: colors.brand[500] },
  outline: { borderWidth: 1, borderColor: colors.brand[500], backgroundColor: "transparent" },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.5 },
  label: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
