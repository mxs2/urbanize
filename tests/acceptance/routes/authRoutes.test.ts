import request from "supertest";
import { app } from "../../../backend/src/app";

describe("Auth Routes - Login", () => {
  it("deve retornar sucesso para credenciais válidas", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "cidadao@urbanize.com", senha: "demo" });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe("cidadao@urbanize.com");
    expect(response.body.data.token).toBeDefined();
  });

  it("deve retornar erro para credenciais inválidas", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "invalido@urbanize.com", senha: "senhaerrada" });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe("Credenciais inválidas.");
  });
});

describe("Auth Routes - Register", () => {
  it("deve registrar um novo usuário com sucesso", async () => {
    const email = `novo-${Date.now()}@urbanize.com`;
    const response = await request(app).post("/api/auth/register").send({
      nome: "Novo Usuário",
      email,
      senha: "senha123",
      telefone: "123456789",
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.token).toBeDefined();
  });
});
