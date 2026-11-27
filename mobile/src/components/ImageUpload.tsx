import { useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadService } from "@/services/uploadService";
import { ImageTriage } from "@/types/demand";
import { colors, radii, spacing } from "@/theme";
import { Button } from "./Button";

interface ImageUploadProps {
  onResult: (result: ImageTriage) => void;
  disabled?: boolean;
}

export function ImageUpload({ onResult, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const processAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setPreview(asset.uri);
    setProcessing(true);
    try {
      const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "foto.jpg";
      const mimeType = asset.mimeType ?? "image/jpeg";
      const result = await uploadService.image({ uri: asset.uri, name: fileName, type: mimeType });
      onResult(result);
    } catch {
      Alert.alert("Erro ao processar imagem", "Não foi possível enviar ou classificar a foto.");
    } finally {
      setProcessing(false);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Autorize o acesso à câmera para fotografar a demanda.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) await processAsset(result.assets[0]);
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Autorize o acesso às fotos para anexar uma imagem.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ["images"] });
    if (!result.canceled) await processAsset(result.assets[0]);
  };

  return (
    <View style={styles.container}>
      {preview ? <Image source={{ uri: preview }} style={styles.preview} /> : null}
      {processing ? (
        <View style={styles.processingRow}>
          <ActivityIndicator color={colors.brand[500]} />
          <Text style={styles.processingText}>Enviando e classificando imagem…</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Tirar foto" variant="outline" onPress={pickFromCamera} disabled={disabled} />
          <Button label="Escolher da galeria" variant="outline" onPress={pickFromLibrary} disabled={disabled} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginBottom: spacing.md },
  preview: { width: "100%", height: 180, borderRadius: radii.md, backgroundColor: colors.border },
  actions: { flexDirection: "row", gap: spacing.sm },
  processingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  processingText: { color: colors.textMuted, fontSize: 13 },
});
