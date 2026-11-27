import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "@/utils/formatDate";
import { colors } from "@/theme";

/** Aviso de que a tela mostra o cache local porque a API não respondeu. */
export function OfflineBanner({ since }: { since?: string }) {
  if (!since) return null;
  return (
    <View testID="banner-offline" role="status" className="mb-3 flex-row items-start gap-2 rounded-md bg-warning/15 p-3">
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
      <View className="flex-1">
        <Text className="text-[13px] font-bold text-ink">Sem conexão</Text>
        <Text className="text-xs text-ink">Mostrando dados salvos no aparelho em {formatDate(since)}.</Text>
      </View>
    </View>
  );
}
