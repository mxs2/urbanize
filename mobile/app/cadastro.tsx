import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Screen } from "@/components/Screen";
import { colors, fontSizes, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

const REGRA_SENHA = "A senha precisa de pelo menos 8 caracteres, com letra e número.";

export default function Cadastro() {
  const { register, loading } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  const handleSubmit = async () => {
    // Mesma regra do backend, para a pessoa saber o motivo antes de enviar.
    if (senha.length < 8 || !/\p{L}/u.test(senha) || !/\d/.test(senha)) {
      setErroSenha(REGRA_SENHA);
      return;
    }
    setErroSenha("");
    try {
      await register(nome, email, senha, telefone || undefined);
      router.replace("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verifique os dados e tente novamente.";
      Alert.alert("Erro ao criar conta", message);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Criar conta</Text>
        <TextField testID="input-nome" label="Nome" value={nome} onChangeText={setNome} />
        <TextField
          testID="input-email"
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField label="Telefone" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
        <TextField testID="input-senha" label="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
        <Text testID="regra-senha" style={erroSenha ? styles.erro : styles.dica}>
          {erroSenha || REGRA_SENHA}
        </Text>
        <Text testID="aviso-privacidade" style={styles.dica}>
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
  container: { padding: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
  title: { fontSize: fontSizes.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  dica: { color: colors.text, opacity: 0.7, marginBottom: spacing.md },
  erro: { color: "#b91c1c", marginBottom: spacing.md },
  link: { marginTop: spacing.md, color: colors.brand[500], textAlign: "center" },
});
