import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { colors, fontSizes, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("cidadao@urbanize.com");
  const [senha, setSenha] = useState("demo");
  const submitting = useRef(false);

  const handleSubmit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await login(email, senha);
      const user = useAuthStore.getState().user;
      router.replace(user?.role === "gestor" ? "/gestor" : "/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email ou senha inválidos.";
      Alert.alert("Erro ao entrar", message);
    } finally {
      submitting.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Entrar</Text>
      <TextField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField label="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
      <Button label="Entrar" onPress={handleSubmit} loading={loading} />
      <Link href="/cadastro" style={styles.link}>
        Ainda não tem conta? Criar conta
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: "center", backgroundColor: colors.background },
  title: { fontSize: fontSizes.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  link: { marginTop: spacing.md, color: colors.brand[500], textAlign: "center" },
});
