import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Armazenamento da sessão (token JWT + dados do usuário).
 *
 * No iOS e no Android usa o Keychain / Keystore via expo-secure-store (RS12).
 * Na web não existe cofre do sistema, então cai para o AsyncStorage (localStorage).
 *
 * Tem a mesma forma de `StateStorage` do zustand, para ser usado direto no `persist`.
 */
const isNative = Platform.OS !== "web";

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  // Não sobe para backup em nuvem nem migra para outro aparelho.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Versões anteriores gravavam a sessão em AsyncStorage (texto plano). Na primeira leitura
 * move o valor para o cofre e apaga o original, para o token antigo não ficar no aparelho.
 */
const migrateLegacyValue = async (key: string): Promise<string | null> => {
  const legacy = await AsyncStorage.getItem(key);
  if (legacy === null) return null;
  await SecureStore.setItemAsync(key, legacy, SECURE_OPTIONS);
  await AsyncStorage.removeItem(key);
  return legacy;
};

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isNative) return AsyncStorage.getItem(key);
    try {
      return (await SecureStore.getItemAsync(key, SECURE_OPTIONS)) ?? (await migrateLegacyValue(key));
    } catch {
      // Cofre indisponível (ex.: Keychain bloqueado): trata como sem sessão e pede login.
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isNative) return AsyncStorage.setItem(key, value);
    try {
      await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
    } catch {
      // Nunca cair para AsyncStorage: o token ficaria em texto plano. A sessão só
      // não sobrevive ao fechamento do app.
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!isNative) return AsyncStorage.removeItem(key);
    try {
      await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
    } catch {
      // Nada a remover ou cofre indisponível.
    }
    // Garante que um valor legado nunca sobreviva ao logout.
    await AsyncStorage.removeItem(key).catch(() => undefined);
  },
};
