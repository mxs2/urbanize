import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorState({ message, onRetry, testID }: ErrorStateProps) {
  return (
    <View testID={testID} role="alert" className="gap-3 rounded-md border border-danger/30 bg-danger/10 p-3">
      <View className="flex-row items-start gap-2">
        <Ionicons name="alert-circle" size={18} color={colors.danger} />
        <Text className="flex-1 text-sm font-medium text-danger">{message}</Text>
      </View>
      {onRetry ? <Button label="Tentar novamente" variant="outline" size="sm" icon="refresh" onPress={onRetry} /> : null}
    </View>
  );
}
