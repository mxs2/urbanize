import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { colors, radii, spacing } from "@/theme";
import { Button } from "./Button";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationCaptureProps {
  value?: Coordinates;
  onChange: (coordinates?: Coordinates) => void;
}

export function LocationCapture({ value, onChange }: LocationCaptureProps) {
  const [locating, setLocating] = useState(false);

  const capture = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Autorize o acesso à localização para registrar as coordenadas da demanda."
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      Alert.alert("Erro ao localizar", "Não foi possível obter a localização do dispositivo.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.container}>
      {value ? (
        <View style={styles.coordsBox}>
          <Text style={styles.coordsText}>
            Coordenadas: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </Text>
        </View>
      ) : null}
      {locating ? (
        <View style={styles.locatingRow}>
          <ActivityIndicator color={colors.brand[500]} />
          <Text style={styles.locatingText}>Obtendo localização…</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button
            label={value ? "Atualizar localização" : "Usar minha localização"}
            variant="outline"
            onPress={capture}
          />
          {value ? <Button label="Remover" variant="ghost" onPress={() => onChange(undefined)} /> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginTop: spacing.xs },
  coordsBox: { backgroundColor: colors.brand[50], borderRadius: radii.md, padding: spacing.sm },
  coordsText: { color: colors.brand[800], fontSize: 13 },
  actions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  locatingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  locatingText: { color: colors.textMuted, fontSize: 13 },
});
