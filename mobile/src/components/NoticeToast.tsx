import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useNoticeStore } from "@/store/noticeStore";
import { colors, radii, spacing } from "@/theme";

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
      style={styles.container}
      onPress={() => {
        dismiss();
        if (notice.demandId) router.push(`/demandas/${notice.demandId}`);
      }}
    >
      <Text style={styles.title}>{notice.title}</Text>
      <Text style={styles.body}>{notice.body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
    backgroundColor: colors.brand[800],
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: { color: "#fff", fontWeight: "700", fontSize: 14 },
  body: { color: colors.brand[100], fontSize: 13 },
});
