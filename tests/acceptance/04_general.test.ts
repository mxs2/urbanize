import request from "supertest";
import { app } from "../../backend/src/app";
import { env } from "../../backend/src/config/env";

describe("SUT API Tests - Infraestrutura, Healthcheck e Roteamento Geral", () => {
  describe("GET /api - Catálogo e Metadados da API", () => {
    it("CT-GEN-01: Deve responder com metadados do sistema e catálogo de endpoints públicos com status 200", async () => {
      const response = await request(app).get("/api");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Urbanize API");
      expect(response.body.data.status).toBe("ok");
      expect(response.body.data.endpoints).toBeDefined();
      expect(response.body.data.endpoints.auth).toBe("/api/auth");
      expect(response.body.data.endpoints.demands).toBe("/api/demands");
      expect(response.body.data.endpoints.metrics).toBe("/api/metrics");
      expect(response.body.data.endpoints.organs).toBe("/api/organs");
    });
  });

  describe("GET /api/health - Monitoramento de Liveness", () => {
    it("CT-GEN-02: Deve retornar status 200 com payload confirmando saúde do serviço", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("ok");
    });
  });

  describe("Roteamento Não Encontrado (404 Not Found)", () => {
    it("TC27 / CT-GEN-03: Deve responder com status 404 padronizado ao requisitar rota inexistente", async () => {
      const response = await request(app).get("/api/endpoint-completamente-inexistente-xyz");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe("NOT_FOUND");
      expect(response.body.error.message).toMatch(/não encontrada/i);
    });
  });

  describe("GET / - Redirecionamento Inicial", () => {
    it("CT-GEN-04: Deve redirecionar requisições na raiz para /api com status 302", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe("/api");
    });
  });

  describe("HTTPS obrigatório em produção (RS08)", () => {
    const original = { requireHttps: env.requireHttps, trustProxy: app.get("trust proxy") };

    beforeEach(() => {
      env.requireHttps = true;
      app.set("trust proxy", 1);
    });

    afterEach(() => {
      env.requireHttps = original.requireHttps;
      app.set("trust proxy", original.trustProxy);
    });

    it("TC101: Deve recusar com 426 requisição que chegou por HTTP", async () => {
      const response = await request(app).get("/api").set("X-Forwarded-Proto", "http");

      expect(response.status).toBe(426);
      expect(response.body.error.code).toBe("HTTPS_REQUIRED");
    });

    it("TC102: Deve aceitar requisição que o proxy informa ter chegado por HTTPS e enviar HSTS", async () => {
      const response = await request(app).get("/api").set("X-Forwarded-Proto", "https");

      expect(response.status).toBe(200);
      expect(response.headers["strict-transport-security"]).toMatch(/max-age=\d+/);
    });

    it("TC103: Deve manter o healthcheck acessível por HTTP para o Docker", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
    });
  });
});
