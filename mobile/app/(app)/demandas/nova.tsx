import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useDemandStore } from "@/store/demandStore";
import { api } from "@/services/api";
import { Demand, DemandCategory, DemandPriority } from "@/types/demand";
import { Organ, buildEmailLink, buildWhatsappLink } from "@/types/organ";
import { categoryLabel } from "@/utils/categoryLabel";
import { colors, fontSizes, radii, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { ImageUpload, ImageUploadResult } from "@/components/ImageUpload";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";

export default function NovaDemanda() {
  const { ready, user } = useRoleGuard(["cidadao"]);
  const { createDemand } = useDemandStore();

  const [organs, setOrgans] = useState<Organ[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<DemandCategory>("outros");
  const [prioridade, setPrioridade] = useState<DemandPriority>("media");
  const [imagemUrl, setImagemUrl] = useState<string | undefined>();
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("Recife");
  const [referencia, setReferencia] = useState("");
  const [aceite, setAceite] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready)
      api
        .getOrgans()
        .then(setOrgans)
        .catch(() => undefined);
  }, [ready]);

  const matchedOrgan = useMemo(
    () => organs.find((organ) => (JSON.parse(organ.categoriasJson) as DemandCategory[]).includes(categoria)),
    [organs, categoria]
  );

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect -- one-shot suggestion sync when the matched organ or category changes, not a render-derived value */
  useEffect(() => {
    if (matchedOrgan && !titulo && !descricao) {
      setTitulo(categoryLabel[categoria]);
      setDescricao(
        `Demanda referente a "${categoryLabel[categoria]}", possivelmente de responsabilidade de ${matchedOrgan.nome}.`
      );
    }
  }, [matchedOrgan, categoria]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  const handleImageResult = (result: ImageUploadResult) => {
    setImagemUrl(result.imageUrl);
    setCategoria(result.triagem.categoria);
    setTitulo(categoryLabel[result.triagem.categoria]);
  };

  const handleSubmit = async () => {
    if (!aceite) {
      Alert.alert("Confirme o aceite", "É necessário concordar em compartilhar estes dados.");
      return;
    }
    if (!titulo.trim() || !descricao.trim() || !endereco.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha os campos obrigatórios.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const payload: Omit<Demand, "id" | "protocolo" | "criadaEm" | "atualizadaEm"> = {
        titulo,
        descricao,
        categoria,
        prioridade,
        status: "registrada",
        nomeSolicitante: user.nome,
        emailSolicitante: user.email,
        endereco: { endereco, bairro, cidade, referencia: referencia || undefined },
        origem: "cidadao",
        imagemUrl,
        historico: [],
      };
      const created = await createDemand(payload);
      Alert.alert("Demanda registrada", `Protocolo ${created.protocolo}`);
      router.replace(`/demandas/${created.id}`);
    } catch {
      Alert.alert("Erro", "Não foi possível registrar a demanda.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nova demanda</Text>

      <ImageUpload onResult={handleImageResult} />

      {matchedOrgan ? (
        <View style={styles.organAlert}>
          <Text style={styles.organText}>
            Identificamos que esta demanda pode ser de responsabilidade de {matchedOrgan.nome}.
          </Text>
          <View style={styles.organActions}>
            {buildWhatsappLink(matchedOrgan, "-", titulo) ? (
              <Button
                label="WhatsApp"
                variant="outline"
                onPress={() => Linking.openURL(buildWhatsappLink(matchedOrgan, "-", titulo)!)}
              />
            ) : null}
            {buildEmailLink(matchedOrgan, "-", titulo) ? (
              <Button
                label="Email"
                variant="outline"
                onPress={() => Linking.openURL(buildEmailLink(matchedOrgan, "-", titulo)!)}
              />
            ) : null}
            {matchedOrgan.site ? (
              <Button
                label="Site oficial"
                variant="outline"
                onPress={() => Linking.openURL(matchedOrgan.site!)}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      <TextField label="Título" required value={titulo} onChangeText={setTitulo} />
      <TextField
        label="Descrição"
        required
        multiline
        numberOfLines={4}
        value={descricao}
        onChangeText={setDescricao}
      />
      <Select
        label="Prioridade"
        value={prioridade}
        options={[
          { label: "Baixa", value: "baixa" },
          { label: "Média", value: "media" },
          { label: "Alta", value: "alta" },
        ]}
        onChange={(value) => setPrioridade(value as DemandPriority)}
      />

      <Text style={styles.sectionLabel}>Localização</Text>
      <TextField label="Endereço/Rua" required value={endereco} onChangeText={setEndereco} />
      <TextField label="Bairro" value={bairro} onChangeText={setBairro} />
      <TextField label="Cidade" value={cidade} onChangeText={setCidade} />
      <TextField label="Ponto de referência" value={referencia} onChangeText={setReferencia} />

      <Pressable style={styles.consentRow} onPress={() => setAceite(!aceite)}>
        <View style={[styles.checkbox, aceite && styles.checkboxChecked]} />
        <Text style={styles.consentText}>
          Concordo em compartilhar estes dados com o órgão responsável pela demanda.
        </Text>
      </Pressable>

      <View style={styles.footerActions}>
        <Button label="Registrar demanda" onPress={handleSubmit} loading={submitting} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.push("/demandas")} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  sectionLabel: { fontSize: fontSizes.md, fontWeight: "700", color: colors.text, marginTop: spacing.md },
  organAlert: {
    backgroundColor: colors.brand[50],
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  organText: { color: colors.brand[800], fontSize: 13 },
  organActions: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginVertical: spacing.md },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.brand[500], borderColor: colors.brand[500] },
  consentText: { flex: 1, fontSize: 12, color: colors.textMuted },
  footerActions: { gap: spacing.sm },
});
