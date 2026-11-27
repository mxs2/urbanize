import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { Screen } from "@/components/Screen";
import { FieldErrors, hasErrors, validateLogin } from "@/utils/validation";
import { errorMessage } from "@/utils/errorMessage";
import { colors, fontSizes, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { TextField } from "@/components/TextField";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("cidadao@urbanize.com");
  const [senha, setSenha] = useState("demo");
  const [errors, setErrors] = useState<FieldErrors<"email" | "senha">>({});
  const [apiError, setApiError] = useState<string>();
  const submitting = useRef(false);

  const handleSubmit = async () => {
    if (submitting.current) return;
    const validation = validateLogin({ email, senha });
    setErrors(validation);
    setApiError(undefined);
    if (hasErrors(validation)) return;

    submitting.current = true;
    try {
      await login(email.trim(), senha);
      const user = useAuthStore.getState().user;
      router.replace(user?.role === "gestor" ? "/gestor" : "/dashboard");
    } catch (error) {
      setApiError(errorMessage(error, "Email ou senha inválidos."));
    } finally {
      submitting.current = false;
    }
  };

  return (
    <Screen>
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      {apiError ? <ErrorState testID="erro-login" message={apiError} /> : null}
      <TextField
        testID="input-email"
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <TextField
        testID="input-senha"
        label="Senha"
        secureTextEntry
        autoComplete="password"
        value={senha}
        onChangeText={setSenha}
        onSubmitEditing={handleSubmit}
        error={errors.senha}
      />
      <Button testID="btn-entrar" label="Entrar" onPress={handleSubmit} loading={loading} />
      <Link href="/cadastro" style={styles.link}>
        Ainda não tem conta? Criar conta
      </Link>
    </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: "center", gap: spacing.sm, backgroundColor: colors.background },
  title: { fontSize: fontSizes.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  link: { marginTop: spacing.md, color: colors.brand[500], textAlign: "center" },
});
