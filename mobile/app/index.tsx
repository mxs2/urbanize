import { ComponentProps } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { AuthHeader } from "@/components/AuthHeader";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";

const STEPS: { icon: ComponentProps<typeof Ionicons>["name"]; title: string; text: string }[] = [
  { icon: "camera-outline", title: "Registre", text: "Foto e localização do problema, direto do celular." },
  { icon: "git-branch-outline", title: "Triagem", text: "A categoria e o órgão responsável são sugeridos na hora." },
  { icon: "eye-outline", title: "Acompanhe", text: "Cada mudança de status fica no histórico da demanda." },
  { icon: "notifications-outline", title: "Seja avisado", text: "Você recebe uma notificação quando o status muda." },
];

export default function Home() {
  return (
    <Screen>
      <ScrollView className="bg-canvas" contentContainerClassName="flex-grow justify-center p-6">
        <AuthHeader
          title="Problemas da cidade, resolvidos com transparência"
          subtitle="Cidadãos registram demandas urbanas; a prefeitura organiza, encaminha e responde."
        />

        <View className="mb-8 gap-2">
          <Button label="Entrar" onPress={() => router.push("/login")} />
          <Button label="Criar conta" variant="outline" onPress={() => router.push("/cadastro")} />
        </View>

        <View className="gap-4">
          {STEPS.map((step) => (
            <View key={step.title} className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                <Ionicons name={step.icon} size={20} color={colors.brand[600]} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-ink">{step.title}</Text>
                <Text className="text-[13px] text-ink-muted">{step.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
