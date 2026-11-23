import * as SecureStore from "expo-secure-store";
import { secureStorage } from "@/services/secureStorage";
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
    (SecureStore as unknown as { __store: Map<string, string> }).__store.clear();
  });

  it("TC20: deve preferir o token em memória ao valor persistido (evita a corrida do persist)", async () => {
    await secureStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ state: { token: "token-antigo" } }));
    setAuthToken("token-novo");

    await expect(getAuthToken()).resolves.toBe("token-novo");
  });

  it("deve recuperar o token persistido no cold start", async () => {
    await secureStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ state: { token: "token-persistido" } }));

    await expect(getAuthToken()).resolves.toBe("token-persistido");
  });

  it("deve retornar null quando o storage está vazio ou corrompido", async () => {
    await expect(getAuthToken()).resolves.toBeNull();

    resetSessionForTests();
    await secureStorage.setItem(AUTH_STORAGE_KEY, "não é json");

    await expect(getAuthToken()).resolves.toBeNull();
  });

  it("deve limpar o token no logout", async () => {
    setAuthToken("token");
    clearAuthToken();

    await expect(getAuthToken()).resolves.toBeNull();
  });
});
