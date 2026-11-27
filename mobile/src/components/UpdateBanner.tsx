import { Pressable, Text, View } from "react-native";
import { useOtaUpdate } from "@/hooks/useOtaUpdate";

/** Faixa no topo quando uma atualização OTA já foi baixada. */
export function UpdateBanner() {
  const { ready, apply } = useOtaUpdate();
  if (!ready) return null;

  return (
    <View role="status" className="flex-row items-center justify-between bg-brand-700 px-4 py-2">
      <Text className="text-[13px] text-white">Nova versão do app disponível.</Text>
      <Pressable onPress={apply} hitSlop={8}>
        <Text className="text-[13px] font-bold text-white underline">Reiniciar</Text>
      </Pressable>
    </View>
  );
}
