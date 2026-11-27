import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme";

/**
 * Base das telas públicas: ocupa a tela inteira e mantém o conteúdo fora do relógio e da
 * barra inferior do aparelho. As telas logadas já recebem isso de app/(app)/_layout.tsx.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
