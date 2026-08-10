import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { DemandRole } from "@/types/user";
import { colors, fontSizes, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { TextField } from "@/components/TextField";

export default function Cadastro() {
  const { register, loading } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<DemandRole>("cidadao");

  const handleSubmit = async () => {
    try {
      await register(nome, email, senha, telefone || undefined, role);
      router.replace(role === "gestor" ? "/gestor" : "/dashboard");
    } catch {
      Alert.alert("Erro ao criar conta", "Verifique os dados e tente novamente.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <TextField label="Nome" value={nome} onChangeText={setNome} />
      <TextField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextField label="Telefone" keyboardType="phone-pad" value={telefone} onChangeText={setTelefone} />
      <TextField label="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
      <Select
        label="Perfil"
        value={role}
        options={[
          { label: "Cidadão", value: "cidadao" },
          { label: "Gestor público", value: "gestor" },
        ]}
        onChange={(value) => setRole(value as DemandRole)}
      />
      <Button label="Criar conta" onPress={handleSubmit} loading={loading} />
      <Link href="/login" style={styles.link}>
        Já tem conta? Entrar
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
  title: { fontSize: fontSizes.xl, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  link: { marginTop: spacing.md, color: colors.brand[500], textAlign: "center" },
});
