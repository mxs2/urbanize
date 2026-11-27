import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { Screen } from "@/components/Screen";
import { FieldErrors, hasErrors, validateLogin } from "@/utils/validation";
import { errorMessage } from "@/utils/errorMessage";
import { AuthHeader } from "@/components/AuthHeader";
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
      <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="flex-grow justify-center p-6" keyboardShouldPersistTaps="handled">
          <AuthHeader title="Entrar" subtitle="Acompanhe suas demandas ou a fila da prefeitura." />
          {apiError ? (
            <View className="mb-4">
              <ErrorState testID="erro-login" message={apiError} />
            </View>
          ) : null}
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
          <Link href="/cadastro" className="mt-6 text-center text-sm text-brand-600">
            Ainda não tem conta? <Text className="font-bold">Criar conta</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
