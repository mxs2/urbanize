import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Slot, router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { colors, spacing } from "@/theme";
import { LoadingState } from "@/components/LoadingState";

const CIDADAO_LINKS = [
  { href: "/dashboard", label: "Início" },
  { href: "/demandas", label: "Minhas demandas" },
  { href: "/demandas/nova", label: "Nova demanda" },
  { href: "/avisos", label: "Avisos" },
];

const GESTOR_LINKS = [
  { href: "/gestor", label: "Painel" },
  { href: "/demandas", label: "Demandas" },
];

export default function AppLayout() {
  const { user, hydrated, logout } = useAuthStore();
  const pathname = usePathname();
  const [naoLidas, setNaoLidas] = useState(0);
  const isCidadao = user?.role === "cidadao";

  // Recarrega o contador de avisos a cada troca de tela do cidadão.
  useEffect(() => {
    if (!isCidadao) return;
    api
      .getNotifications()
      .then((avisos) => setNaoLidas(avisos.filter((a) => !a.lida).length))
      .catch(() => undefined);
  }, [isCidadao, pathname]);

  // Navegar durante o render quebra o roteador; o redirect fica no efeito.
  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user]);

  if (!hydrated || !user) return <LoadingState />;

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
            <Pressable
              key={link.href}
              testID={`tab-${link.href}`}
              style={styles.tabItem}
              onPress={() => router.push(link.href as never)}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{link.label}</Text>
              {link.href === "/avisos" && naoLidas > 0 && !active ? (
                <Text testID="badge-avisos" style={styles.badge}>
                  {naoLidas}
                </Text>
              ) : null}
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
  badge: {
    position: "absolute",
    top: -4,
    right: "25%",
    minWidth: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    color: colors.surface,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    overflow: "hidden",
  },
});
