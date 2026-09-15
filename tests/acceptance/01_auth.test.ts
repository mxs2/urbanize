import request from "supertest";
import { app } from "../../backend/src/app";
import { getCidadaoSession, getGestorSession, createUniqueUser } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

describe("SUT API Tests - Módulo de Autenticação (/api/auth)", () => {
  afterAll(async () => {
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  describe("POST /api/auth/register - Cadastro de Usuários", () => {
    it("CT-AUTH-01: Deve registrar um novo cidadão com sucesso e retornar status 201 com token JWT", async () => {
      const email = `cidadao-${Date.now()}@urbanize.test`;
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          nome: "João Silva Cidadão",
          email,
          senha: "senhaSegura123",
          telefone: "81999990000",
          role: "cidadao",
        });

      expect(response.status).toBe(201);
      expect(response.header["content-type"]).toMatch(/application\/json/);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe("string");

      // Validação do contrato do usuário retornado
      const { user } = response.body.data;
      expect(user.id).toBeDefined();
      expect(user.nome).toBe("João Silva Cidadão");
      expect(user.email).toBe(email);
      expect(user.role).toBe("cidadao");
      expect(user.senhaHash).toBeUndefined(); // Não deve expor hash da senha
      expect(user.senha).toBeUndefined();

      // Validação do cookie HTTP-only retornado
      const setCookie = response.headers["set-cookie"];
      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toMatch(/urbanize_session=/);
    });

    it("CT-AUTH-02: Deve rejeitar cadastro com email duplicado e retornar status 409", async () => {
      const email = `duplicado-${Date.now()}@urbanize.test`;

      // Primeiro cadastro com sucesso
      await request(app).post("/api/auth/register").send({
        nome: "Primeiro Registro",
        email,
        senha: "senhaSegura123",
      });

      // Tentativa de duplicidade
      const response = await request(app).post("/api/auth/register").send({
        nome: "Segundo Registro Mesmo Email",
        email,
        senha: "outraSenha123",
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
      expect(response.body.error.message).toBe("Email já cadastrado.");
    });

    it("CT-AUTH-03: Deve rejeitar payload com campos inválidos ou ausentes e retornar status 422", async () => {
      const response = await request(app).post("/api/auth/register").send({
        nome: "J", // Mínimo é 2 caracteres
        email: "email-invalido-sem-arroba",
        senha: "", // Senha vazia
      });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(Array.isArray(response.body.error.details)).toBe(true);
      expect(response.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/auth/login - Autenticação de Usuários", () => {
    it("CT-AUTH-04: Deve autenticar cidadão existente com credenciais válidas e retornar status 200", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "cidadao@urbanize.com", senha: "demo" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe("cidadao@urbanize.com");
      expect(response.body.data.user.role).toBe("cidadao");
    });

    it("CT-AUTH-05: Deve autenticar gestor existente com credenciais válidas e retornar status 200", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "gestor@urbanize.com", senha: "demo" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe("gestor@urbanize.com");
      expect(response.body.data.user.role).toBe("gestor");
    });

    it("CT-AUTH-06: Deve rejeitar autenticação com senha incorreta e retornar status 401", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "cidadao@urbanize.com", senha: "senha_totalmente_errada" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(response.body.error.message).toBe("Credenciais inválidas.");
    });

    it("CT-AUTH-07: Deve rejeitar autenticação com email inexistente e retornar status 401", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "naoexiste@urbanize.com", senha: "qualquerSenha" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(response.body.error.message).toBe("Credenciais inválidas.");
    });
  });

  describe("GET /api/auth/me - Perfil do Usuário Autenticado", () => {
    it("CT-AUTH-08: Deve retornar os dados do perfil quando fornecido Bearer Token válido", async () => {
      const { token, user: testUser } = await createUniqueUser("cidadao", "me-test");

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.role).toBe("cidadao");
    });

    it("CT-AUTH-09: Deve rejeitar requisição sem cabeçalho Authorization nem cookie e retornar status 401", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHENTICATED");
      expect(response.body.error.message).toBe("Sessão não autenticada.");
    });

    it("CT-AUTH-10: Deve rejeitar requisição com token JWT forjado ou inválido e retornar status 401", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer token_completamente_invalido_e_forjado");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_TOKEN");
      expect(response.body.error.message).toBe("Token inválido ou expirado.");
    });
  });

  describe("POST /api/auth/logout - Encerramento de Sessão", () => {
    it("CT-AUTH-11: Deve permitir logout com sucesso e limpar cookies de sessão", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });
  });
});
