import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { Button } from "./Button";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-6 py-8">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50">
        <Ionicons name="file-tray-outline" size={22} color={colors.brand[500]} />
      </View>
      <Text className="text-center text-sm text-ink-muted">{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} icon="add" size="sm" onPress={onAction} /> : null}
    </View>
  );
}
