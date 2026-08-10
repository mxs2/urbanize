import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.xs },
  row: { gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.brand[500], borderColor: colors.brand[500] },
  chipLabel: { fontSize: 13, color: colors.text },
  chipLabelActive: { color: "#fff", fontWeight: "600" },
});
