import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { api, Notificacao } from "@/services/api";
import { colors, radii, spacing } from "@/theme";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { SectionTitle } from "@/components/SectionTitle";

export default function Avisos() {
  const { ready } = useRoleGuard(["cidadao"]);
  const [avisos, setAvisos] = useState<Notificacao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    api
      .getNotifications()
      .then((lista) => {
        setAvisos(lista);
        // Abrir a tela conta como leitura; a lista mantém o destaque dos que eram novos.
        if (lista.some((a) => !a.lida)) api.markNotificationsRead().catch(() => undefined);
      })
      .catch((e: Error) => setErro(e.message));
  }, [ready]);

  if (!ready) return <LoadingState />;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={avisos ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <SectionTitle title="Avisos" subtitle="Mudanças de status nas suas demandas" />
          {erro ? <ErrorState message={erro} /> : !avisos ? <LoadingState /> : null}
        </>
      }
      ListEmptyComponent={avisos ? <EmptyState message="Nenhum aviso por enquanto." /> : null}
      renderItem={({ item }) => (
        <Pressable
          testID={`aviso-${item.id}`}
          style={[styles.item, !item.lida && styles.itemNovo]}
          onPress={() => router.push(`/demandas/${item.demandId}`)}
        >
          <Text style={[styles.mensagem, !item.lida && styles.mensagemNova]}>{item.mensagem}</Text>
          <Text style={styles.data}>{new Date(item.criadaEm).toLocaleString("pt-BR")}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  itemNovo: { borderLeftWidth: 4, borderLeftColor: colors.brand[500] },
  mensagem: { color: colors.text, fontSize: 14 },
  mensagemNova: { fontWeight: "700" },
  data: { color: colors.textMuted, fontSize: 12 },
});
