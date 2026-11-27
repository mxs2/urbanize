import { useState } from "react";
import { Platform, ScrollView, Share, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { colors, fontSizes, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { SectionTitle } from "@/components/SectionTitle";
import { LoadingState } from "@/components/LoadingState";

interface Feedback {
  text: string;
  error?: boolean;
}

const mensagem = (error: unknown): Feedback => ({
  text: error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente.",
  error: true,
});

/** Na web baixa um arquivo; no celular abre o compartilhamento do sistema. */
const entregarArquivo = async (conteudo: string) => {
  if (Platform.OS !== "web") {
    await Share.share({ title: "Meus dados no Urbanize", message: conteudo });
    return;
  }
  const url = URL.createObjectURL(new Blob([conteudo], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "urbanize-meus-dados.json";
  link.click();
  URL.revokeObjectURL(url);
};

// Mensagens na própria tela: `Alert` não aparece na versão web.
const Aviso = ({ feedback }: { feedback: Feedback | null }) =>
  feedback ? <Text style={feedback.error ? styles.erro : styles.sucesso}>{feedback.text}</Text> : null;

export default function Perfil() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const [nome, setNome] = useState(user?.nome ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [telefone, setTelefone] = useState(user?.telefone ?? "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [busy, setBusy] = useState<"salvar" | "exportar" | "excluir" | null>(null);
  const [dadosAviso, setDadosAviso] = useState<Feedback | null>(null);
  const [copiaAviso, setCopiaAviso] = useState<Feedback | null>(null);
  const [exclusaoAviso, setExclusaoAviso] = useState<Feedback | null>(null);

  if (!user) return <LoadingState />;

  const trocouEmail = email.trim().toLowerCase() !== user.email;

  const salvar = async () => {
    setBusy("salvar");
    setDadosAviso(null);
    try {
      await updateProfile({
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        ...(trocouEmail ? { email: email.trim(), senhaAtual } : {}),
      });
      setSenhaAtual("");
      setDadosAviso({ text: "Dados atualizados." });
    } catch (error) {
      setDadosAviso(mensagem(error));
    } finally {
      setBusy(null);
    }
  };

  const exportar = async () => {
    setBusy("exportar");
    setCopiaAviso(null);
    try {
      await entregarArquivo(JSON.stringify(await api.exportMyData(), null, 2));
    } catch (error) {
      setCopiaAviso(mensagem(error));
    } finally {
      setBusy(null);
    }
  };

  const excluir = async () => {
    setBusy("excluir");
    setExclusaoAviso(null);
    try {
      await deleteAccount(senhaExclusao);
      router.replace("/login");
    } catch (error) {
      setExclusaoAviso(mensagem(error));
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Meu perfil</Text>

      <SectionTitle title="Meus dados" />
      <TextField testID="perfil-nome" label="Nome" value={nome} onChangeText={setNome} />
      <TextField
        testID="perfil-email"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField label="Telefone" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
      {trocouEmail ? (
        <TextField label="Senha atual" secureTextEntry value={senhaAtual} onChangeText={setSenhaAtual} />
      ) : null}
      <Aviso feedback={dadosAviso} />
      <Button testID="btn-salvar-perfil" label="Salvar" onPress={salvar} loading={busy === "salvar"} />

      <SectionTitle title="Cópia dos meus dados" subtitle="Arquivo com sua conta, demandas e registros de acesso." />
      <Aviso feedback={copiaAviso} />
      <Button
        testID="btn-exportar-dados"
        label="Baixar meus dados"
        variant="outline"
        onPress={exportar}
        loading={busy === "exportar"}
      />

      {user.role === "cidadao" ? (
        <>
          <SectionTitle title="Excluir conta" />
          <Text style={styles.texto}>
            A exclusão é definitiva. Suas demandas continuam no histórico da gestão pública sem seu nome, contato,
            ponto de referência, coordenadas e foto. Endereço, título e descrição são mantidos.
          </Text>
          {confirmando ? (
            <>
              <TextField
                testID="perfil-senha-exclusao"
                label="Digite sua senha para confirmar"
                secureTextEntry
                value={senhaExclusao}
                onChangeText={setSenhaExclusao}
              />
              <Aviso feedback={exclusaoAviso} />
              <Button
                testID="btn-confirmar-exclusao"
                label="Excluir definitivamente"
                onPress={excluir}
                disabled={!senhaExclusao}
                loading={busy === "excluir"}
              />
              <Button label="Cancelar" variant="ghost" onPress={() => setConfirmando(false)} />
            </>
          ) : (
            <Button
              testID="btn-excluir-conta"
              label="Excluir minha conta"
              variant="outline"
              onPress={() => setConfirmando(true)}
            />
          )}
        </>
      ) : (
        <Text style={styles.texto}>
          Para excluir sua conta, peça antes o descredenciamento a outro gestor do seu órgão.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { fontSize: fontSizes.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  texto: { fontSize: 13, color: colors.textMuted },
  erro: { color: "#b91c1c" },
  sucesso: { color: colors.success },
});
