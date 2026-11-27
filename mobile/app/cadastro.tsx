import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Screen } from "@/components/Screen";
import { FieldErrors, PASSWORD_RULE, hasErrors, validateSignup } from "@/utils/validation";
import { errorMessage } from "@/utils/errorMessage";
import { colors, fontSizes, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { TextField } from "@/components/TextField";

export default function Cadastro() {
  const { register, loading } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"nome" | "email" | "senha" | "telefone">>({});
  const [apiError, setApiError] = useState<string>();

  const handleSubmit = async () => {
    const validation = validateSignup({ nome, email, senha, telefone });
    setErrors(validation);
    setApiError(undefined);
    if (hasErrors(validation)) return;

    try {
      await register(nome.trim(), email.trim(), senha, telefone.trim() || undefined);
      router.replace("/dashboard");
    } catch (error) {
      setApiError(errorMessage(error, "Verifique os dados e tente novamente."));
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.hint}>
          O cadastro cria um perfil de cidadão. Contas de gestor são criadas pela prefeitura.
        </Text>
        {apiError ? <ErrorState testID="erro-cadastro" message={apiError} /> : null}
        <TextField testID="input-nome" label="Nome" required value={nome} onChangeText={setNome} error={errors.nome} />
        <TextField
          testID="input-email"
          label="Email"
          required
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />
        <TextField
          testID="input-telefone"
          label="Telefone"
          keyboardType="phone-pad"
          placeholder="(81) 99999-9999"
          value={telefone}
          onChangeText={setTelefone}
          error={errors.telefone}
        />
        <TextField
          testID="input-senha"
          label="Senha"
          required
          secureTextEntry
          autoComplete="new-password"
          value={senha}
          onChangeText={setSenha}
          error={errors.senha}
        />
        {errors.senha ? null : (
          <Text testID="regra-senha" style={styles.hint}>
            {PASSWORD_RULE}
          </Text>
        )}
        <Text testID="aviso-privacidade" style={styles.hint}>
          Usamos seu nome, e-mail e telefone para criar a conta e responder às suas demandas, que são vistas pelo órgão
          responsável. Em Perfil você corrige, baixa ou exclui seus dados. O contato em demandas encerradas é
          anonimizado após 12 meses.
        </Text>
        <Button testID="btn-criar-conta" label="Criar conta" onPress={handleSubmit} loading={loading} />
        <Link href="/login" style={styles.link}>
          Já tem conta? Entrar
        </Link>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.background, flexGrow: 1 },
  title: { fontSize: fontSizes.xl, fontWeight: "700", color: colors.text },
  hint: { fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing.md },
  link: { marginTop: spacing.md, color: colors.brand[500], textAlign: "center" },
});
