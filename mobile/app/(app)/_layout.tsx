import { ComponentProps, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { Slot, router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { colors } from "@/theme";
import { cx } from "@/utils/cx";
import { LoadingState } from "@/components/LoadingState";
import { NoticeToast } from "@/components/NoticeToast";
import { useNotifications } from "@/hooks/useNotifications";

type IconName = ComponentProps<typeof Ionicons>["name"];

const CIDADAO_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Início", icon: "home-outline" },
  { href: "/demandas", label: "Minhas demandas", icon: "list-outline" },
  { href: "/demandas/nova", label: "Nova demanda", icon: "add-circle-outline" },
  { href: "/perfil", label: "Perfil", icon: "person-circle-outline" },
];

const GESTOR_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/gestor", label: "Painel", icon: "grid-outline" },
  { href: "/demandas", label: "Demandas", icon: "list-outline" },
  { href: "/perfil", label: "Perfil", icon: "person-circle-outline" },
];

function TabItem({
  label,
  icon,
  active,
  onPress,
  testID,
}: {
  label: string;
  icon: IconName;
  active?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      role="tab"
      aria-selected={active}
      onPress={onPress}
      className="flex-1 items-center gap-1 py-1.5"
    >
      <Ionicons name={icon} size={22} color={active ? colors.brand[500] : colors.textMuted} />
      <Text className={cx("text-[11px]", active ? "font-bold text-brand-500" : "font-medium text-ink-muted")}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AppLayout() {
  const { user, hydrated, logout } = useAuthStore();
  const pathname = usePathname();
  useNotifications(hydrated ? user : null);

  // Navegar durante o render quebra o roteador; o redirect fica no efeito.
  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user]);

  if (!hydrated || !user) return <LoadingState />;

  const links = user.role === "gestor" ? GESTOR_LINKS : CIDADAO_LINKS;

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom"]}>
      <View className="flex-1">
        <Slot />
        <NoticeToast />
      </View>
      <View role="tablist" className="flex-row border-t border-line bg-surface px-2 pb-1 pt-2">
        {links.map((link) => (
          <TabItem
            key={link.href}
            testID={`tab-${link.href}`}
            label={link.label}
            icon={link.icon}
            active={pathname === link.href}
            onPress={() => router.push(link.href as never)}
          />
        ))}
        <TabItem
          label="Sair"
          icon="log-out-outline"
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
