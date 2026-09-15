import request from "supertest";
import { app } from "../../backend/src/app";
import { getCidadaoSession, getGestorSession, createUniqueUser } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

describe("SUT API Tests - Módulo de Demandas (/api/demands)", () => {
  let cidadaoToken: string;
  let gestorToken: string;
  let createdDemandId: string;
  let createdProtocolo: string;

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

  describe("POST /api/demands - Criação de Demandas", () => {
    it("CT-DEM-01: Deve permitir que cidadão crie uma demanda válida com protocolo e histórico inicial", async () => {
      const payload = {
        titulo: "Lâmpada queimada na calçada",
        descricao: "A lâmpada do poste em frente ao número 120 queimou ontem à noite.",
        categoria: "iluminacao_publica",
        prioridade: "media",
        endereco: {
          endereco: "Rua da Aurora, 120",
          bairro: "Boa Vista",
          cidade: "Recife",
          referencia: "Próximo à ponte",
        },
      };

      const response = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      const demand = response.body.data;
      expect(demand.id).toBeDefined();
      expect(demand.protocolo).toMatch(/^URB-\d{5}$/);
      expect(demand.status).toBe("em_analise");
      expect(demand.titulo).toBe(payload.titulo);
      expect(demand.descricao).toBe(payload.descricao);
      expect(demand.categoria).toBe(payload.categoria);
      expect(demand.scoreTriagem).toBeDefined();
      expect(demand.sugestaoEncaminhamento).toBeDefined();

      // Validação da auditoria e histórico inicial
      expect(Array.isArray(demand.historico)).toBe(true);
      expect(demand.historico.length).toBe(2);
      expect(demand.historico[0].status).toBe("registrada");
      expect(demand.historico[1].status).toBe("em_analise");

      // Guarda IDs para os testes subsequentes
      createdDemandId = demand.id;
      createdProtocolo = demand.protocolo;
    });

    it("CT-DEM-02: Deve rejeitar criação de demanda sem autenticação e retornar status 401", async () => {
      const response = await request(app).post("/api/demands").send({
        titulo: "Sem autenticação",
        descricao: "Tentando criar demanda anônima sem fornecer Bearer Token.",
        categoria: "vias_publicas",
        endereco: { endereco: "Av. Caxangá" },
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHENTICATED");
    });

    it("CT-DEM-03: Deve rejeitar criação com título muito curto (< 3 caracteres) e retornar status 422", async () => {
      const response = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          titulo: "Oi", // Inválido (< 3 caracteres)
          descricao: "Descrição válida com mais de 5 caracteres.",
          categoria: "vias_publicas",
          endereco: { endereco: "Rua do Hospício" },
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      const details = response.body.error.details;
      expect(details.some((d: any) => d.path.includes("titulo"))).toBe(true);
    });

    it("CT-DEM-04: Deve rejeitar criação com descrição muito curta (< 5 caracteres) e retornar status 422", async () => {
      const response = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          titulo: "Título Válido",
          descricao: "curt", // Inválido (< 5 caracteres)
          categoria: "vias_publicas",
          endereco: { endereco: "Rua do Sol" },
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      const details = response.body.error.details;
      expect(details.some((d: any) => d.path.includes("descricao"))).toBe(true);
    });

    it("CT-DEM-05: Deve rejeitar criação com categoria inválida fora do enum e retornar status 422", async () => {
      const response = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          titulo: "Buraco na pista",
          descricao: "Asfalto quebrado na esquina.",
          categoria: "categoria_inexistente_xpto",
          endereco: { endereco: "Rua da Concórdia" },
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("CT-DEM-06: Deve rejeitar criação sem objeto de endereço obrigatório e retornar status 422", async () => {
      const response = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          titulo: "Sem Endereço Fornecido",
          descricao: "Descrição com tamanho suficiente.",
          categoria: "zeladoria",
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/demands - Listagem e Filtros com Regras de Perfil", () => {
    it("CT-DEM-07: Cidadão autenticado deve receber somente as demandas de sua própria autoria", async () => {
      // Cria um cidadão isolado com suas próprias demandas
      const userA = await createUniqueUser("cidadao", "cidadao-a");
      const userB = await createUniqueUser("cidadao", "cidadao-b");

      // User A cria demanda
      const resDemandA = await request(app)
        .post("/api/demands")
        .set("Authorization", `Bearer ${userA.token}`)
        .send({
          titulo: "Demanda do Cidadão A",
          descricao: "Essa demanda pertence exclusivamente ao usuário A.",
          categoria: "saneamento",
          endereco: { endereco: "Rua A, 100" },
        });
      expect(resDemandA.status).toBe(201);
      const demandAId = resDemandA.body.data.id;

      // User B lista demandas: NÃO deve enxergar a demanda do User A
      const resListB = await request(app)
        .get("/api/demands")
        .set("Authorization", `Bearer ${userB.token}`);

      expect(resListB.status).toBe(200);
      expect(Array.isArray(resListB.body.data)).toBe(true);
      const idsUserB = resListB.body.data.map((d: any) => d.id);
      expect(idsUserB).not.toContain(demandAId);

      // User A lista demandas: DEVE enxergar sua demanda
      const resListA = await request(app)
        .get("/api/demands")
        .set("Authorization", `Bearer ${userA.token}`);

      expect(resListA.status).toBe(200);
      const idsUserA = resListA.body.data.map((d: any) => d.id);
      expect(idsUserA).toContain(demandAId);
    });

    it("CT-DEM-08: Gestor público deve visualizar demandas de múltiplos cidadãos na fila geral", async () => {
      const response = await request(app)
        .get("/api/demands")
        .set("Authorization", `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("CT-DEM-09: Deve filtrar demandas por status corretamente", async () => {
      const response = await request(app)
        .get("/api/demands?status=em_analise")
        .set("Authorization", `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach((demand: any) => {
        expect(demand.status).toBe("em_analise");
      });
    });

    it("CT-DEM-10: Deve filtrar demandas por categoria corretamente", async () => {
      const response = await request(app)
        .get("/api/demands?categoria=iluminacao_publica")
        .set("Authorization", `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      response.body.data.forEach((demand: any) => {
        expect(demand.categoria).toBe("iluminacao_publica");
      });
    });

    it("CT-DEM-11: Deve filtrar demandas por termo de busca no protocolo ou título", async () => {
      const response = await request(app)
        .get(`/api/demands?busca=${createdProtocolo}`)
        .set("Authorization", `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].protocolo).toBe(createdProtocolo);
    });

    it("CT-DEM-12: Deve rejeitar listagem sem token e retornar status 401", async () => {
      const response = await request(app).get("/api/demands");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("GET /api/demands/:id - Detalhes e Proteção de Acesso (IDOR)", () => {
    it("CT-DEM-13: Cidadão deve conseguir consultar detalhes e timeline de sua própria demanda", async () => {
      const response = await request(app)
        .get(`/api/demands/${createdDemandId}`)
        .set("Authorization", `Bearer ${cidadaoToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdDemandId);
      expect(response.body.data.historico).toBeDefined();
    });

    it("CT-DEM-14: Cidadão deve ser impedido de visualizar demanda de outro usuário (Status 403 / IDOR)", async () => {
      // Cria outro cidadão que não é o dono da demanda
      const outroCidadao = await createUniqueUser("cidadao", "invasor");

      const response = await request(app)
        .get(`/api/demands/${createdDemandId}`)
        .set("Authorization", `Bearer ${outroCidadao.token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
      expect(response.body.error.message).toBe("Você não tem permissão para acessar esta demanda.");
    });

    it("CT-DEM-15: Gestor público deve conseguir visualizar demanda de qualquer cidadão", async () => {
      const response = await request(app)
        .get(`/api/demands/${createdDemandId}`)
        .set("Authorization", `Bearer ${gestorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdDemandId);
    });

    it("CT-DEM-16: Deve retornar status 404 ao consultar ID de demanda inexistente", async () => {
      const response = await request(app)
        .get("/api/demands/id-totalmente-inexistente-12345")
        .set("Authorization", `Bearer ${gestorToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("DEMAND_NOT_FOUND");
    });
  });

  describe("PATCH /api/demands/:id/status - Alteração de Status e Auditoria (RBAC)", () => {
    it("CT-DEM-17 [Regra Crítica]: Cidadão deve ser proibido de alterar o status de qualquer demanda (Status 403)", async () => {
      const response = await request(app)
        .patch(`/api/demands/${createdDemandId}/status`)
        .set("Authorization", `Bearer ${cidadaoToken}`)
        .send({
          status: "resolvida",
          observacaoGestor: "Tentativa de cidadão fechar a própria demanda.",
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("FORBIDDEN");
      expect(response.body.error.message).toBe("Somente gestores podem alterar status.");
    });

    it("CT-DEM-18: Gestor deve conseguir alterar o status da demanda e registrar no histórico", async () => {
      const observacao = "Equipe de manutenção foi despachada para o local.";

      const response = await request(app)
        .patch(`/api/demands/${createdDemandId}/status`)
        .set("Authorization", `Bearer ${gestorToken}`)
        .send({
          status: "em_atendimento",
          observacaoGestor: observacao,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("em_atendimento");
      expect(response.body.data.observacaoGestor).toBe(observacao);

      // Validação do histórico: deve ter 3 eventos (registrada + em_analise + em_atendimento)
      const historico = response.body.data.historico;
      expect(historico.length).toBe(3);
      const ultimoEvento = historico[historico.length - 1];
      expect(ultimoEvento.status).toBe("em_atendimento");
      expect(ultimoEvento.descricao).toBe(observacao);
      expect(ultimoEvento.autor).toBe("Gestor Emlurb");
    });

    it("CT-DEM-19: Deve rejeitar alteração para status inválido fora do enum com status 422", async () => {
      const response = await request(app)
        .patch(`/api/demands/${createdDemandId}/status`)
        .set("Authorization", `Bearer ${gestorToken}`)
        .send({
          status: "status_inexistente",
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("CT-DEM-20: Deve retornar status 404 ao tentar atualizar status de demanda inexistente", async () => {
      const response = await request(app)
        .patch("/api/demands/id-inexistente-99999/status")
        .set("Authorization", `Bearer ${gestorToken}`)
        .send({
          status: "resolvida",
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("DEMAND_NOT_FOUND");
    });

    it("CT-DEM-21: Deve rejeitar alteração de status sem token e retornar status 401", async () => {
      const response = await request(app)
        .patch(`/api/demands/${createdDemandId}/status`)
        .send({ status: "resolvida" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHENTICATED");
    });
  });
});
