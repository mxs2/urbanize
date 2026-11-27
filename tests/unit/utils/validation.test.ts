import { hasErrors, validateDemand, validateLogin, validateSignup } from "@/utils/validation";

describe("Validação de formulários", () => {
  it("aceita o login de demonstração", () => {
    expect(hasErrors(validateLogin({ email: "cidadao@urbanize.com", senha: "demo" }))).toBe(false);
  });

  it("aponta email inválido e senha vazia no login", () => {
    expect(validateLogin({ email: "cidadao", senha: "" })).toEqual({
      email: "Email inválido.",
      senha: "Informe a senha.",
    });
  });

  it("exige nome, senha mínima e telefone com DDD no cadastro", () => {
    const errors = validateSignup({ nome: "A", email: "a@b.co", senha: "123", telefone: "9999" });

    expect(Object.keys(errors).sort()).toEqual(["nome", "senha", "telefone"]);
  });

  it("aceita telefone formatado no cadastro", () => {
    const errors = validateSignup({ nome: "Maria", email: "maria@urbanize.test", senha: "segura123", telefone: "(81) 99999-0000" });

    expect(errors).toEqual({});
  });

  it("segue os mínimos do backend ao registrar uma demanda", () => {
    const errors = validateDemand({ titulo: "ab", descricao: "curt", endereco: "", aceite: false });

    expect(Object.keys(errors).sort()).toEqual(["aceite", "descricao", "endereco", "titulo"]);
    expect(
      validateDemand({ titulo: "Buraco", descricao: "Buraco grande", endereco: "Rua A, 10", aceite: true })
    ).toEqual({});
  });
});
