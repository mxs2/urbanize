import { useState } from "react";
import { ActivityIndicator, Alert, Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadService } from "@/services/uploadService";
import { ImageTriage } from "@/types/demand";
import { errorMessage } from "@/utils/errorMessage";
import { colors } from "@/theme";
import { Button } from "./Button";

interface ImageUploadProps {
  onResult: (result: ImageTriage) => void;
  disabled?: boolean;
}

export function ImageUpload({ onResult, disabled }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();

  const processAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setPreview(asset.uri);
    setProcessing(true);
    setError(undefined);
    try {
      const fileName = asset.fileName ?? asset.uri.split("/").pop() ?? "foto.jpg";
      const mimeType = asset.mimeType ?? "image/jpeg";
      onResult(await uploadService.image({ uri: asset.uri, name: fileName, type: mimeType }));
    } catch (err) {
      setError(errorMessage(err, "Não foi possível enviar ou classificar a foto."));
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
    <View className="mb-4 gap-3 rounded-lg border border-line bg-surface p-4">
      <View>
        <Text className="text-[15px] font-bold text-ink">Foto do problema</Text>
        <Text className="text-xs text-ink-muted">A triagem automática sugere a categoria a partir da imagem.</Text>
      </View>
      {preview ? <Image source={{ uri: preview }} className="h-48 w-full rounded-md bg-line" /> : null}
      {processing ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator color={colors.brand[500]} />
          <Text className="text-[13px] text-ink-muted">Enviando e classificando imagem…</Text>
        </View>
      ) : (
        <View className="flex-row gap-2">
          <Button className="flex-1" label="Câmera" icon="camera-outline" variant="outline" onPress={pickFromCamera} disabled={disabled} />
          <Button className="flex-1" label="Galeria" icon="images-outline" variant="outline" onPress={pickFromLibrary} disabled={disabled} />
        </View>
      )}
      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
