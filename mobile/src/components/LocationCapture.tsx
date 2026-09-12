import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { colors, radii, spacing } from "@/theme";
import { Button } from "./Button";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CapturedAddress {
  endereco?: string;
  bairro?: string;
  cidade?: string;
}

interface LocationCaptureProps {
  value?: Coordinates;
  onChange: (coordinates?: Coordinates) => void;
  onAddressResolved?: (address: CapturedAddress) => void;
}

export function LocationCapture({ value, onChange, onAddressResolved }: LocationCaptureProps) {
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
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      onChange(coordinates);

      if (onAddressResolved) {
        try {
          const [place] = await Location.reverseGeocodeAsync(coordinates);
          if (place) {
            const rua = [place.street, place.streetNumber].filter(Boolean).join(", ");
            onAddressResolved({
              endereco: rua || undefined,
              bairro: place.district ?? place.subregion ?? undefined,
              cidade: place.city ?? undefined,
            });
          }
        } catch {
          // reverse geocoding é best-effort: coordenadas já foram salvas acima
        }
      }
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
