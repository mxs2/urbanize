import { useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useDemandStore } from "@/store/demandStore";
import { resolveImageUrl } from "@/services/api";
import { DemandStatus } from "@/types/demand";
import { categoryLabel } from "@/utils/categoryLabel";
import { errorMessage } from "@/utils/errorMessage";
import { formatDate } from "@/utils/formatDate";
import { formatLocation } from "@/utils/locationLabel";
import { statusLabel } from "@/utils/statusLabel";
import { colors } from "@/theme";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DemandTimeline } from "@/components/DemandTimeline";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PriorityBadge } from "@/components/PriorityBadge";
import { SectionTitle } from "@/components/SectionTitle";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";

const GESTOR_TRANSITIONS: DemandStatus[] = ["em_analise", "encaminhada", "em_atendimento", "resolvida", "cancelada"];

function InfoRow({ icon, text }: { icon: "location-outline" | "pricetag-outline" | "business-outline"; text: string }) {
  return (
    <View className="flex-row items-start gap-2">
      <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginTop: 1 }} />
      <Text className="flex-1 text-[13px] text-ink-muted">{text}</Text>
    </View>
  );
}

export default function DemandDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, user } = useRoleGuard(["cidadao", "gestor"]);
  const { selected, loading, saving, error, offlineSince, fetchDemandById, updateDemandStatus } = useDemandStore();
  const [observacao, setObservacao] = useState("");
  const [actionError, setActionError] = useState<string>();
  const [feedback, setFeedback] = useState<string>();

  useEffect(() => {
    if (ready && id) fetchDemandById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, id]);

  if (!ready || !user) return <LoadingState />;
  if (error && !selected) {
    return (
      <View className="p-6">
        <ErrorState testID="erro-detalhe" message={error} onRetry={() => id && fetchDemandById(id)} />
      </View>
    );
  }
  if (loading || !selected) return <LoadingState label="Carregando demanda…" />;

  const isGestor = user.role === "gestor";

  const handleTransition = async (status: DemandStatus) => {
    setActionError(undefined);
    setFeedback(undefined);
    try {
      await updateDemandStatus(selected.id, status, observacao || `Status atualizado para ${statusLabel[status]}`);
      setFeedback(`Status alterado para ${statusLabel[status]}. O cidadão será notificado.`);
      setObservacao("");
    } catch (err) {
      setActionError(errorMessage(err, "Não foi possível atualizar a demanda."));
    }
  };

  return (
    <ScrollView contentContainerClassName="gap-4 p-6 pb-10">
      <OfflineBanner since={offlineSince} />

      <View className="gap-2">
        <Text className="text-xs font-semibold tracking-wide text-ink-muted">{selected.protocolo}</Text>
        <Text className="text-2xl font-bold text-ink">{selected.titulo}</Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <StatusBadge testID="status-atual" status={selected.status} />
          <PriorityBadge priority={selected.prioridade} />
          <Text className="text-xs text-ink-muted">{formatDate(selected.criadaEm)}</Text>
        </View>
      </View>

      {selected.imagemUrl ? (
        <Image
          testID="foto-demanda"
          source={{ uri: resolveImageUrl(selected.imagemUrl) }}
          className="h-56 w-full rounded-lg bg-line"
          accessibilityLabel="Foto enviada pelo cidadão"
        />
      ) : null}

      <Card className="gap-3">
        <Text className="text-[15px] leading-6 text-ink">{selected.descricao}</Text>
        <InfoRow icon="location-outline" text={formatLocation(selected.endereco)} />
        <InfoRow icon="pricetag-outline" text={categoryLabel[selected.categoria]} />
        {selected.sugestaoEncaminhamento ? (
          <InfoRow icon="business-outline" text={`Órgão sugerido: ${selected.sugestaoEncaminhamento}`} />
        ) : null}
      </Card>

      <View>
        <SectionTitle title="Histórico" />
        <DemandTimeline historico={selected.historico} />
      </View>

      {isGestor && !offlineSince ? (
        <Card className="gap-1">
          <SectionTitle title="Ação do gestor" subtitle="A mudança de status notifica o cidadão." />
          <TextField
            testID="input-observacao"
            label="Observação"
            multiline
            numberOfLines={3}
            value={observacao}
            onChangeText={setObservacao}
          />
          {actionError ? <ErrorState testID="erro-status" message={actionError} /> : null}
          {feedback ? (
            <View testID="feedback-status" role="status" className="mb-3 flex-row items-center gap-2 rounded-md bg-success/10 p-3">
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text className="flex-1 text-[13px] text-ink">{feedback}</Text>
            </View>
          ) : null}
          <View className="flex-row flex-wrap gap-2">
            {GESTOR_TRANSITIONS.map((status) => (
              <Button
                key={status}
                size="sm"
                testID={`btn-status-${status}`}
                label={statusLabel[status]}
                variant={status === selected.status ? "ghost" : "outline"}
                disabled={status === selected.status || saving}
                onPress={() => handleTransition(status)}
              />
            ))}
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}
