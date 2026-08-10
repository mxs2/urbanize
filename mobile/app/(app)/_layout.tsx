import { Pressable, StyleSheet, Text, View } from "react-native";
import { Slot, router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { colors, spacing } from "@/theme";
import { LoadingState } from "@/components/LoadingState";

const CIDADAO_LINKS = [
  { href: "/dashboard", label: "Início" },
  { href: "/demandas", label: "Minhas demandas" },
  { href: "/demandas/nova", label: "Nova demanda" },
];

const GESTOR_LINKS = [
  { href: "/gestor", label: "Painel" },
  { href: "/demandas", label: "Demandas" },
];

export default function AppLayout() {
  const { user, hydrated, logout } = useAuthStore();
  const pathname = usePathname();

  if (!hydrated) return <LoadingState />;

  if (!user) {
    router.replace("/login");
    return <LoadingState />;
  }

  const links = user.role === "gestor" ? GESTOR_LINKS : CIDADAO_LINKS;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Slot />
      </View>
      <View style={styles.tabBar}>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Pressable key={link.href} style={styles.tabItem} onPress={() => router.push(link.href as never)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{link.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={styles.tabItem}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <Text style={styles.tabLabel}>Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: spacing.xs },
  tabLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  tabLabelActive: { color: colors.brand[500], fontWeight: "700" },
});
