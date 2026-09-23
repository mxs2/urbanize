import { StyleSheet, Text, View } from "react-native";

interface BadgeProps {
  label: string;
  color: string;
  testID?: string;
}

export function Badge({ label, color, testID }: BadgeProps) {
  return (
    <View testID={testID} style={[styles.badge, { backgroundColor: `${color}22`, borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
