import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Slot } from "expo-router";
import { UpdateBanner } from "@/components/UpdateBanner";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <UpdateBanner />
      <Slot />
    </SafeAreaProvider>
  );
}
