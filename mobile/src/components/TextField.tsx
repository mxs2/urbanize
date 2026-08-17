import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radii, spacing } from "@/theme";

interface TextFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
}

export function TextField({ label, required, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? " *" : ""}
      </Text>
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.textMuted} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});
