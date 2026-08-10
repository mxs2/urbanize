import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fontSizes, spacing } from "@/theme";
import { Button } from "@/components/Button";
import { categoryLabel } from "@/utils/categoryLabel";

const STEPS = [
  "Registre uma demanda urbana com foto e localização",
  "Nossa triagem automática sugere o órgão responsável",
  "Acompanhe o status em tempo real",
  "Receba a resolução e histórico completo",
];

export default function Home() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hero}>Urbanize</Text>
      <Text style={styles.subtitle}>
        Plataforma de gestão de demandas urbanas com backend real e diferenciação de perfis (Cidadão e Gestor)
      </Text>

      <View style={styles.ctaRow}>
        <Button label="Entrar" onPress={() => router.push("/login")} />
        <Button label="Criar conta" variant="outline" onPress={() => router.push("/cadastro")} />
      </View>

      <Text style={styles.sectionTitle}>Como funciona</Text>
      {STEPS.map((step, index) => (
        <Text key={step} style={styles.step}>
          {index + 1}. {step}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Categorias</Text>
      <View style={styles.tagRow}>
        {Object.values(categoryLabel).map((label) => (
          <View key={label} style={styles.tag}>
            <Text style={styles.tagLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.background },
  hero: { fontSize: fontSizes.xl, fontWeight: "800", color: colors.brand[700] },
  subtitle: { fontSize: fontSizes.sm, color: colors.textMuted, marginBottom: spacing.md },
  ctaRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: "700", color: colors.text, marginTop: spacing.md },
  step: { fontSize: fontSizes.sm, color: colors.text, marginTop: spacing.xs },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  tag: {
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  tagLabel: { color: colors.brand[700], fontSize: 12, fontWeight: "600" },
});
