import { authService } from "@/services/authService";
import { api } from "@/services/api";

jest.mock("@/services/api");

describe("AuthService", () => {
  it("deve chamar o método login do API com email e senha corretos", async () => {
    const mockLogin = jest.spyOn(api, "login").mockResolvedValue({
      user: { id: "1", nome: "Cidadão Demo", email: "cidadao@urbanize.com", role: "cidadao" },
      token: "mockToken",
    });

    const result = await authService.login({ email: "cidadao@urbanize.com", senha: "demo" });

    expect(mockLogin).toHaveBeenCalledWith("cidadao@urbanize.com", "demo");
    expect(result.user.email).toBe("cidadao@urbanize.com");
    expect(result.token).toBe("mockToken");
  });

  it("deve lançar um erro se as credenciais forem inválidas", async () => {
    jest.spyOn(api, "login").mockRejectedValue(new Error("Credenciais inválidas."));

    await expect(authService.login({ email: "invalido@urbanize.com", senha: "senhaerrada" })).rejects.toThrow(
      "Credenciais inválidas."
    );
  });
});
