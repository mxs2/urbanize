import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useDemandStore } from "@/store/demandStore";
import { organService } from "@/services/organService";
import { DemandCategory, DemandPriority, ImageTriage, NewDemandInput } from "@/types/demand";
import { Organ, buildEmailLink, buildWhatsappLink } from "@/types/organ";
import { categoryLabel } from "@/utils/categoryLabel";
import { cx } from "@/utils/cx";
import { errorMessage } from "@/utils/errorMessage";
import { priorityLabel } from "@/utils/priorityLabel";
import { FieldErrors, hasErrors, validateDemand } from "@/utils/validation";
import { colors } from "@/theme";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { ImageUpload } from "@/components/ImageUpload";
import { CapturedAddress, Coordinates, LocationCapture } from "@/components/LocationCapture";
import { SectionTitle } from "@/components/SectionTitle";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export default function NovaDemanda() {
  const { ready, user } = useRoleGuard(["cidadao"]);
  const { createDemand, saving } = useDemandStore();

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
  const [coordenadas, setCoordenadas] = useState<Coordinates | undefined>();
  const [aceite, setAceite] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<"titulo" | "descricao" | "endereco" | "aceite">>({});
  const [apiError, setApiError] = useState<string>();

  useEffect(() => {
    if (ready)
      organService
        .list()
        .then(setOrgans)
        .catch(() => undefined);
  }, [ready]);

  const matchedOrgan = useMemo(() => organService.findByCategory(organs, categoria), [organs, categoria]);

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

  const handleAddressResolved = (address: CapturedAddress) => {
    if (address.endereco) setEndereco(address.endereco);
    if (address.bairro) setBairro(address.bairro);
    if (address.cidade) setCidade(address.cidade);
  };

  const handleImageResult = (result: ImageTriage) => {
    setImagemUrl(result.imageUrl);
    setCategoria(result.triagem.categoria);
    setTitulo(categoryLabel[result.triagem.categoria]);
  };

  const handleSubmit = async () => {
    const validation = validateDemand({ titulo, descricao, endereco, aceite });
    setErrors(validation);
    setApiError(undefined);
    if (hasErrors(validation) || !user) return;

    try {
      const payload: NewDemandInput = {
        titulo,
        descricao,
        categoria,
        prioridade,
        status: "registrada",
        nomeSolicitante: user.nome,
        emailSolicitante: user.email,
        endereco: {
          endereco,
          bairro,
          cidade,
          referencia: referencia || undefined,
          latitude: coordenadas?.latitude,
          longitude: coordenadas?.longitude,
        },
        origem: "cidadao",
        imagemUrl,
        historico: [],
      };
      const created = await createDemand(payload);
      router.replace(`/demandas/${created.id}`);
    } catch (error) {
      setApiError(errorMessage(error, "Não foi possível registrar a demanda."));
    }
  };

  if (!ready) return null;

  const whatsapp = matchedOrgan ? buildWhatsappLink(matchedOrgan, "-", titulo) : null;
  const email = matchedOrgan ? buildEmailLink(matchedOrgan, "-", titulo) : null;

  return (
    <ScrollView contentContainerClassName="p-6 pb-10" keyboardShouldPersistTaps="handled">
      <SectionTitle title="Nova demanda" subtitle="Conte o que aconteceu e onde. A prefeitura recebe na hora." />

      {/* O aceite vem antes da foto: o envio e a triagem acontecem assim que ela é escolhida. */}
      <Pressable
        testID="checkbox-aceite"
        role="checkbox"
        aria-checked={aceite}
        onPress={() => setAceite(!aceite)}
        className="mb-3 flex-row items-start gap-3"
      >
        <View
          className={cx(
            "mt-0.5 h-5 w-5 items-center justify-center rounded border",
            aceite ? "border-brand-500 bg-brand-500" : errors.aceite ? "border-danger" : "border-line bg-surface"
          )}
        >
          {aceite ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </View>
        <Text className="flex-1 text-xs text-ink-muted">
          Concordo em compartilhar estes dados com o órgão responsável pela demanda. A foto pode ser enviada ao Google
          (Cloud Vision) para classificação automática. Evite fotografar pessoas e placas de veículos. Marque para
          anexar uma foto ou registrar.
        </Text>
      </Pressable>
      {errors.aceite ? (
        <Text testID="checkbox-aceite-erro" className="mb-2 text-xs text-danger">
          {errors.aceite}
        </Text>
      ) : null}

      <ImageUpload onResult={handleImageResult} disabled={!aceite} />

      {matchedOrgan ? (
        <View className="mb-4 gap-3 rounded-lg bg-brand-50 p-4">
          <View className="flex-row items-start gap-2">
            <Ionicons name="business-outline" size={18} color={colors.brand[700]} />
            <Text className="flex-1 text-[13px] text-brand-800">
              Esta demanda deve ser de responsabilidade de <Text className="font-bold">{matchedOrgan.nome}</Text>.
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {whatsapp ? (
              <Button size="sm" icon="logo-whatsapp" label="WhatsApp" variant="outline" onPress={() => Linking.openURL(whatsapp)} />
            ) : null}
            {email ? (
              <Button size="sm" icon="mail-outline" label="Email" variant="outline" onPress={() => Linking.openURL(email)} />
            ) : null}
            {matchedOrgan.site ? (
              <Button
                size="sm"
                icon="globe-outline"
                label="Site oficial"
                variant="outline"
                onPress={() => Linking.openURL(matchedOrgan.site!)}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      <Card className="mb-4 pb-0">
        <Text className="mb-3 text-[15px] font-bold text-ink">O que aconteceu</Text>
        <TextField testID="input-titulo" label="Título" required value={titulo} onChangeText={setTitulo} error={errors.titulo} />
        <TextField
          testID="input-descricao"
          label="Descrição"
          required
          multiline
          numberOfLines={4}
          value={descricao}
          onChangeText={setDescricao}
          error={errors.descricao}
        />
        <Select
          testID="select-categoria"
          label="Categoria"
          value={categoria}
          options={toOptions(categoryLabel)}
          onChange={(value) => setCategoria(value as DemandCategory)}
        />
        <Select
          testID="select-prioridade"
          label="Prioridade"
          value={prioridade}
          options={toOptions(priorityLabel)}
          onChange={(value) => setPrioridade(value as DemandPriority)}
        />
      </Card>

      <Card className="mb-4 pb-0">
        <Text className="mb-3 text-[15px] font-bold text-ink">Onde</Text>
        <LocationCapture value={coordenadas} onChange={setCoordenadas} onAddressResolved={handleAddressResolved} />
        <TextField
          testID="input-endereco"
          label="Endereço/Rua"
          required
          value={endereco}
          onChangeText={setEndereco}
          error={errors.endereco}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Bairro" value={bairro} onChangeText={setBairro} />
          </View>
          <View className="flex-1">
            <TextField label="Cidade" value={cidade} onChangeText={setCidade} />
          </View>
        </View>
        <TextField label="Ponto de referência" value={referencia} onChangeText={setReferencia} />
      </Card>

      {apiError ? (
        <View className="my-2">
          <ErrorState testID="erro-registrar" message={apiError} />
        </View>
      ) : null}

      <View className="mt-4 gap-2">
        <Button testID="btn-registrar" label="Registrar demanda" icon="send" onPress={handleSubmit} loading={saving} />
        <Button label="Cancelar" variant="ghost" onPress={() => router.push("/demandas")} />
      </View>
    </ScrollView>
  );
}
