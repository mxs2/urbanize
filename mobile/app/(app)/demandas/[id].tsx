import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useDemandStore } from "@/store/demandStore";
import { resolveImageUrl } from "@/services/api";
import { DemandStatus } from "@/types/demand";
import { formatDate } from "@/utils/formatDate";
import { formatLocation } from "@/utils/locationLabel";
import { statusLabel } from "@/utils/statusLabel";
import { colors, fontSizes, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { errorMessage } from "@/utils/errorMessage";
import { DemandTimeline } from "@/components/DemandTimeline";
import { LoadingState } from "@/components/LoadingState";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PriorityBadge } from "@/components/PriorityBadge";
import { SectionTitle } from "@/components/SectionTitle";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";

const GESTOR_TRANSITIONS: DemandStatus[] = [
  "em_analise",
  "encaminhada",
  "em_atendimento",
  "resolvida",
  "cancelada",
];

export default function DemandDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, user } = useRoleGuard(["cidadao", "gestor"]);
  const { selected, loading, saving, error, offlineSince, fetchDemandById, updateDemandStatus } = useDemandStore();
  const [observacao, setObservacao] = useState("");
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    if (ready && id) fetchDemandById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, id]);

  if (!ready || !user) return <LoadingState />;
  if (error && !selected) {
    return (
      <View style={styles.container}>
        <ErrorState testID="erro-detalhe" message={error} onRetry={() => id && fetchDemandById(id)} />
      </View>
    );
  }
  if (loading || !selected) return <LoadingState />;

  const isGestor = user.role === "gestor";

  const handleTransition = async (status: DemandStatus) => {
    setActionError(undefined);
    try {
      await updateDemandStatus(
        selected.id,
        status,
        observacao || `Status atualizado para ${statusLabel[status]}`
      );
      Alert.alert("Demanda atualizada", `Status alterado para ${statusLabel[status]}.`);
      setObservacao("");
    } catch (err) {
      setActionError(errorMessage(err, "Não foi possível atualizar a demanda."));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <OfflineBanner since={offlineSince} />
      <Text style={styles.protocolo}>{selected.protocolo}</Text>
      <Text style={styles.titulo}>{selected.titulo}</Text>
      <Text style={styles.data}>{formatDate(selected.criadaEm)}</Text>
      <View style={styles.badgeRow}>
        <StatusBadge testID="status-atual" status={selected.status} />
        <PriorityBadge priority={selected.prioridade} />
      </View>
      <Text style={styles.descricao}>{selected.descricao}</Text>
      <Text style={styles.endereco}>{formatLocation(selected.endereco)}</Text>

      {selected.imagemUrl ? (
        <Image source={{ uri: resolveImageUrl(selected.imagemUrl) }} style={styles.foto} />
      ) : null}

      <SectionTitle title="Histórico" />
      <DemandTimeline historico={selected.historico} />

      {isGestor && !offlineSince ? (
        <View style={styles.gestorPanel}>
          <SectionTitle title="Ação do gestor" />
          <TextField
            testID="input-observacao"
            label="Observação"
            multiline
            numberOfLines={3}
            value={observacao}
            onChangeText={setObservacao}
          />
          {actionError ? <ErrorState testID="erro-status" message={actionError} /> : null}
          <View style={styles.transitionRow}>
            {GESTOR_TRANSITIONS.map((status) => (
              <Button
                key={status}
                testID={`btn-status-${status}`}
                label={statusLabel[status]}
                variant={status === selected.status ? "ghost" : "outline"}
                disabled={status === selected.status || saving}
                onPress={() => handleTransition(status)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm },
  protocolo: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  titulo: { fontSize: fontSizes.xl, fontWeight: "700", color: colors.text },
  data: { fontSize: 12, color: colors.textMuted },
  badgeRow: { flexDirection: "row", gap: spacing.xs, marginVertical: spacing.xs },
  descricao: { fontSize: fontSizes.sm, color: colors.text, marginBottom: spacing.sm },
  endereco: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  foto: { width: "100%", height: 220, borderRadius: 10, marginBottom: spacing.md, backgroundColor: colors.border },
  gestorPanel: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  transitionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
