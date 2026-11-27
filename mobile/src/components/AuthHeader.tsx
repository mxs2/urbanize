import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/** Marca + título das telas públicas (início, login, cadastro). */
export function AuthHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-6 gap-4">
      <View className="flex-row items-center gap-2">
        <View className="h-10 w-10 items-center justify-center rounded-md bg-brand-500">
          <Ionicons name="business" size={20} color="#fff" />
        </View>
        <Text className="text-lg font-extrabold text-brand-700">Urbanize</Text>
      </View>
      <View>
        <Text role="heading" className="text-2xl font-bold text-ink">
          {title}
        </Text>
        {subtitle ? <Text className="mt-1 text-sm text-ink-muted">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
