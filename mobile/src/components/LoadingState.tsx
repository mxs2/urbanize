import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@/theme";

export function LoadingState({ label }: { label?: string }) {
  return (
    <View className="items-center justify-center gap-3 p-8" role="progressbar" aria-busy>
      <ActivityIndicator size="large" color={colors.brand[500]} />
      {label ? <Text className="text-sm text-ink-muted">{label}</Text> : null}
    </View>
  );
}
