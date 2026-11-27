import { Text, View } from "react-native";

interface BadgeProps {
  label: string;
  color: string;
  testID?: string;
}

/** Cor vem do status/prioridade em tempo de execução, por isso fica em `style`. */
export function Badge({ label, color, testID }: BadgeProps) {
  return (
    <View
      testID={testID}
      className="flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color}1f` }}
    >
      <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
