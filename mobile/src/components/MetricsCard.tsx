import { ComponentProps } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

interface MetricsCardProps {
  label: string;
  value: string | number;
  helpText?: string;
  accentColor?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  testID?: string;
}

export function MetricsCard({
  label,
  value,
  helpText,
  accentColor = colors.brand[500],
  icon = "stats-chart-outline",
  testID,
}: MetricsCardProps) {
  return (
    <View className="min-w-[140px] flex-1 rounded-lg border border-line bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] text-ink-muted">{label}</Text>
        <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}1f` }}>
          <Ionicons name={icon} size={15} color={accentColor} />
        </View>
      </View>
      <Text testID={testID} className="mt-2 text-[26px] font-bold text-ink">
        {value}
      </Text>
      {helpText ? <Text className="mt-1 text-xs text-ink-muted">{helpText}</Text> : null}
    </View>
  );
}
