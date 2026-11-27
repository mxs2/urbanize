jest.mock("axios", () => {
  const mockHttp = {
    post: jest.fn(),
    request: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
  return { __esModule: true, default: { create: jest.fn(() => mockHttp), isAxiosError: jest.fn(() => false) } };
});

import axios from "axios";
import "@/services/api";
import { getAuthToken, onSessionChange, resetSessionForTests, setSession } from "@/services/session";

const http = axios.create() as unknown as {
  post: jest.Mock;
  request: jest.Mock;
  interceptors: { response: { use: jest.Mock } };
};
const aoFalhar = http.interceptors.response.use.mock.calls[0][1] as (error: unknown) => Promise<unknown>;
const erro = (status: number, url = "/demands") => ({ response: { status }, config: { url, headers: {} } });

describe("Renovação de sessão no app (RS04)", () => {
  const mudancas = jest.fn();

  beforeEach(() => {
    resetSessionForTests();
    jest.clearAllMocks();
    onSessionChange(mudancas);
    setSession("acesso-vencido", "refresh-1");
    http.request.mockResolvedValue("repetida");
  });

  it("deve renovar uma única vez para várias requisições e repeti-las", async () => {
    http.post.mockResolvedValue({ data: { data: { token: "acesso-novo", refreshToken: "refresh-2" } } });

    await expect(Promise.all([aoFalhar(erro(401)), aoFalhar(erro(401))])).resolves.toEqual(["repetida", "repetida"]);

    expect(http.post).toHaveBeenCalledTimes(1);
    expect(http.post).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "refresh-1" });
    expect(mudancas).toHaveBeenCalledWith({ token: "acesso-novo", refreshToken: "refresh-2" });
    await expect(getAuthToken()).resolves.toBe("acesso-novo");
  });

  it("deve encerrar a sessão quando o servidor recusa o refresh token", async () => {
    http.post.mockRejectedValue(erro(401, "/auth/refresh"));
    const original = erro(401);

    await expect(aoFalhar(original)).rejects.toBe(original);

    expect(mudancas).toHaveBeenCalledWith({ token: null, refreshToken: null });
    await expect(getAuthToken()).resolves.toBeNull();
  });

  it("deve manter a sessão quando a renovação falha por rede", async () => {
    http.post.mockRejectedValue(new Error("sem rede"));

    await expect(aoFalhar(erro(401))).rejects.toBeDefined();

    expect(mudancas).not.toHaveBeenCalled();
    await expect(getAuthToken()).resolves.toBe("acesso-vencido");
  });

  it("não deve tentar renovar no 401 do próprio login nem em outros erros", async () => {
    await expect(aoFalhar(erro(401, "/auth/login"))).rejects.toBeDefined();
    await expect(aoFalhar(erro(403))).rejects.toBeDefined();

    expect(http.post).not.toHaveBeenCalled();
  });
});
