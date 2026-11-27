import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNoticeStore } from "@/store/noticeStore";

const AUTO_DISMISS_MS = 8000;

/** Aviso de mudança de status dentro do app; toque abre a demanda. */
export function NoticeToast() {
  const { notice, dismiss } = useNoticeStore();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notice, dismiss]);

  if (!notice) return null;

  return (
    <Pressable
      testID="aviso-notificacao"
      role="alert"
      onPress={() => {
        dismiss();
        if (notice.demandId) router.push(`/demandas/${notice.demandId}`);
      }}
      className="absolute left-4 right-4 top-4 z-10 flex-row items-start gap-3 rounded-lg bg-brand-800 p-4 shadow-lg"
      style={{ elevation: 6 }}
    >
      <Ionicons name="notifications" size={20} color="#fff" />
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-bold text-white">{notice.title}</Text>
        <Text className="text-[13px] text-brand-100">{notice.body}</Text>
      </View>
    </Pressable>
  );
}
