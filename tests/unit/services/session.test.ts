import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AUTH_STORAGE_KEY,
  clearAuthToken,
  getAuthToken,
  resetSessionForTests,
  setAuthToken,
} from "@/services/session";

describe("Session", () => {
  beforeEach(async () => {
    resetSessionForTests();
    await AsyncStorage.clear();
  });

  it("deve preferir o token em memória ao valor persistido (evita a corrida do persist)", async () => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ state: { token: "token-antigo" } }));
    setAuthToken("token-novo");

    await expect(getAuthToken()).resolves.toBe("token-novo");
  });

  it("deve recuperar o token persistido no cold start", async () => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ state: { token: "token-persistido" } }));

    await expect(getAuthToken()).resolves.toBe("token-persistido");
  });

  it("deve retornar null quando o storage está vazio ou corrompido", async () => {
    await expect(getAuthToken()).resolves.toBeNull();

    resetSessionForTests();
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, "não é json");

    await expect(getAuthToken()).resolves.toBeNull();
  });

  it("deve limpar o token no logout", async () => {
    setAuthToken("token");
    clearAuthToken();

    await expect(getAuthToken()).resolves.toBeNull();
  });
});
