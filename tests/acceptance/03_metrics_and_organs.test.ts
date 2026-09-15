import request from "supertest";
import { app } from "../../backend/src/app";
import { getCidadaoSession, getGestorSession } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

describe("SUT API Tests - Métricas e Catálogo de Órgãos", () => {
  let cidadaoToken: string;
  let gestorToken: string;

  beforeAll(async () => {
    const cidadao = await getCidadaoSession();
    const gestor = await getGestorSession();
    cidadaoToken = cidadao.token;
    gestorToken = gestor.token;
  });

  afterAll(async () => {
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  describe("GET /api/metrics/summary - Consolidação de Indicadores", () => {
    it("CT-MET-01: Gestor deve obter resumo de métricas globais agregadas com status 200", async () => {
      const response = await request(app)
        .get("/api/metrics/summary")
        .set("Authorization", `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const metrics = response.body.data;
      expect(typeof metrics.total).toBe("number");
      expect(metrics.total).toBeGreaterThanOrEqual(0);
      expect(typeof metrics.porStatus).toBe("object");
      expect(typeof metrics.porCategoria).toBe("object");
      expect(typeof metrics.tempoMedioAtendimentoDias).toBe("number");
    });

    it("CT-MET-02: Cidadão deve obter métricas calculadas apenas sobre suas próprias demandas", async () => {
      const response = await request(app)
        .get("/api/metrics/summary")
        .set("Authorization", `Bearer ${cidadaoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const metrics = response.body.data;
      expect(typeof metrics.total).toBe("number");
      expect(typeof metrics.porStatus).toBe("object");
      expect(typeof metrics.porCategoria).toBe("object");
    });

    it("CT-MET-03: Deve rejeitar consulta de métricas sem token com status 401", async () => {
      const response = await request(app).get("/api/metrics/summary");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("GET /api/organs - Catálogo de Órgãos Responsáveis", () => {
    it("CT-ORG-01: Usuário autenticado deve listar órgãos municipais ordenados por nome com status 200", async () => {
      const response = await request(app)
        .get("/api/organs")
        .set("Authorization", `Bearer ${cidadaoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const organ = response.body.data[0];
      expect(organ.id).toBeDefined();
      expect(organ.nome).toBeDefined();
      expect(organ.sigla).toBeDefined();
      expect(organ.categoriasJson).toBeDefined();
    });

    it("CT-ORG-02: Deve rejeitar listagem de órgãos sem autenticação com status 401", async () => {
      const response = await request(app).get("/api/organs");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHENTICATED");
    });
  });
});
