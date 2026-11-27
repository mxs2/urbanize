import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Screen } from "@/components/Screen";
import { FieldErrors, PASSWORD_RULE, hasErrors, validateSignup } from "@/utils/validation";
import { errorMessage } from "@/utils/errorMessage";
import { AuthHeader } from "@/components/AuthHeader";
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
      <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="flex-grow justify-center p-6" keyboardShouldPersistTaps="handled">
          <AuthHeader
            title="Criar conta"
            subtitle="O cadastro cria um perfil de cidadão. Contas de gestor são criadas pela prefeitura."
          />
          {apiError ? (
            <View className="mb-4">
              <ErrorState testID="erro-cadastro" message={apiError} />
            </View>
          ) : null}
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
            hint={PASSWORD_RULE}
            value={senha}
            onChangeText={setSenha}
            error={errors.senha}
          />
          <Text testID="aviso-privacidade" className="mb-4 text-xs leading-5 text-ink-muted">
            Usamos seu nome, e-mail e telefone para criar a conta e responder às suas demandas, que são vistas pelo órgão
            responsável. Em Perfil você corrige, baixa ou exclui seus dados. O contato em demandas encerradas é
            anonimizado após 12 meses.
          </Text>
          <Button testID="btn-criar-conta" label="Criar conta" onPress={handleSubmit} loading={loading} />
          <Link href="/login" className="mt-6 text-center text-sm text-brand-600">
            Já tem conta? <Text className="font-bold">Entrar</Text>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
