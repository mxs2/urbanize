import axios from "axios";

// React Native's Jest environment stubs out real networking, so this mocks the HTTP layer
// instead of hitting a live backend (unlike the equivalent web-era test, which ran under Node
// and could make a real request).
jest.mock("axios", () => {
  const mockHttp = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    interceptors: { request: { use: jest.fn() } },
  };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockHttp),
      isAxiosError: jest.fn(() => false),
    },
  };
});

import { api } from "@/services/api";

const mockHttp = axios.create() as unknown as {
  post: jest.Mock;
};

describe("API Service", () => {
  beforeEach(() => {
    mockHttp.post.mockReset();
  });

  it("deve registrar um novo usuário com sucesso", async () => {
    mockHttp.post.mockResolvedValueOnce({
      data: { success: true, data: { user: { id: "1", nome: "Novo Usuário", email: "novo@urbanize.com", role: "cidadao" }, token: "tok" } },
    });

    const result = await api.register("Novo Usuário", "novo@urbanize.com", "senha123", "123456789");

    expect(result.user.email).toBe("novo@urbanize.com");
    expect(result.user.nome).toBe("Novo Usuário");
    expect(result.token).toBe("tok");
  });

  it("deve lançar um erro se o email já estiver registrado", async () => {
    mockHttp.post.mockRejectedValueOnce(new Error("Email já cadastrado."));

    await expect(api.register("Usuário Existente", "cidadao@urbanize.com", "demo")).rejects.toThrow();
  });
});
