import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { secureStorage } from "@/services/secureStorage";

const KEY = "urbanize-auth";
const cofre = (SecureStore as unknown as { __store: Map<string, string> }).__store;

describe("secureStorage (RS12)", () => {
  beforeEach(async () => {
    cofre.clear();
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("RS12: deve gravar a sessão no cofre do sistema e nunca no AsyncStorage", async () => {
    await secureStorage.setItem(KEY, '{"state":{"token":"jwt"}}');

    expect(cofre.get(KEY)).toBe('{"state":{"token":"jwt"}}');
    await expect(AsyncStorage.getItem(KEY)).resolves.toBeNull();
    await expect(secureStorage.getItem(KEY)).resolves.toBe('{"state":{"token":"jwt"}}');
  });

  it("RS12: deve migrar a sessão antiga do AsyncStorage para o cofre e apagar o texto plano", async () => {
    await AsyncStorage.setItem(KEY, '{"state":{"token":"jwt-antigo"}}');

    await expect(secureStorage.getItem(KEY)).resolves.toBe('{"state":{"token":"jwt-antigo"}}');

    expect(cofre.get(KEY)).toBe('{"state":{"token":"jwt-antigo"}}');
    await expect(AsyncStorage.getItem(KEY)).resolves.toBeNull();
  });

  it("deve retornar null quando não há sessão em lugar nenhum", async () => {
    await expect(secureStorage.getItem(KEY)).resolves.toBeNull();
  });

  it("RS12: o logout deve apagar o cofre e qualquer resto no AsyncStorage", async () => {
    await secureStorage.setItem(KEY, "valor");
    await AsyncStorage.setItem(KEY, "resto-antigo");

    await secureStorage.removeItem(KEY);

    expect(cofre.has(KEY)).toBe(false);
    await expect(AsyncStorage.getItem(KEY)).resolves.toBeNull();
  });

  it("deve tratar falha do cofre como sessão ausente, sem cair para texto plano", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error("keychain bloqueado"));
    await expect(secureStorage.getItem(KEY)).resolves.toBeNull();

    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error("keychain bloqueado"));
    await expect(secureStorage.setItem(KEY, "valor")).resolves.toBeUndefined();
    await expect(AsyncStorage.getItem(KEY)).resolves.toBeNull();
  });
});
