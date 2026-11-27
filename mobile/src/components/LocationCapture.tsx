import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
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
  const [error, setError] = useState<string>();

  const capture = async () => {
    setLocating(true);
    setError(undefined);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("Autorize o acesso à localização para registrar as coordenadas da demanda.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
          // Endereço é best-effort: as coordenadas já foram salvas acima.
        }
      }
    } catch {
      setError("Não foi possível obter a localização do dispositivo.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <View className="mb-4 gap-3">
      {value ? (
        <View className="flex-row items-center gap-2 rounded-md bg-brand-50 p-3">
          <Ionicons name="navigate" size={16} color={colors.brand[600]} />
          <Text className="flex-1 text-[13px] text-brand-800">
            GPS: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </Text>
        </View>
      ) : null}
      {locating ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator color={colors.brand[500]} />
          <Text className="text-[13px] text-ink-muted">Obtendo localização…</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          <Button
            label={value ? "Atualizar localização" : "Usar minha localização"}
            icon="locate-outline"
            variant="outline"
            onPress={capture}
          />
          {value ? <Button label="Remover" variant="ghost" onPress={() => onChange(undefined)} /> : null}
        </View>
      )}
      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
