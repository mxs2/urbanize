import request from "supertest";
import { app } from "../../backend/src/app";
import { createUniqueUser, getGestorSession, AuthSession } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

const camposValidos = {
  titulo: "Buraco na via",
  descricao: "Buraco grande no meio da rua, perigo para motos.",
  categoria: "vias_publicas",
};

const criarDemanda = (token: string, payload: object) =>
  request(app).post("/api/demands").set("Authorization", `Bearer ${token}`).send(payload);

const listarDemandas = (token: string, query: Record<string, string>) =>
  request(app).get("/api/demands").query(query).set("Authorization", `Bearer ${token}`);

describe("SUT API Tests - Valores padrão e filtros de demandas (/api/demands)", () => {
  let cidadao: AuthSession;
  let gestorToken: string;

  beforeAll(async () => {
    cidadao = await createUniqueUser("cidadao", "hyngrid");
    gestorToken = (await getGestorSession()).token;
  });

  afterAll(async () => {
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  describe("POST /api/demands - Valores padrão e limites", () => {
    it("TC30: Deve aplicar prioridade padrão media quando prioridade é omitida", async () => {
      const response = await criarDemanda(cidadao.token, {
        ...camposValidos,
        endereco: { endereco: "Rua Exemplo, 100" },
      });

      expect(response.status).toBe(201);
      expect(response.body.data.prioridade).toBe("media");
    });

    it("TC31: Deve aplicar bairro e cidade padrão quando omitidos", async () => {
      const response = await criarDemanda(cidadao.token, {
        ...camposValidos,
        endereco: { endereco: "Rua Exemplo, 100" },
      });

      expect(response.status).toBe(201);
      expect(response.body.data.endereco.bairro).toBe("Não informado");
      expect(response.body.data.endereco.cidade).toBe("Recife");
    });

    it("TC32: Deve preencher o solicitante com os dados do usuário autenticado", async () => {
      const response = await criarDemanda(cidadao.token, {
        ...camposValidos,
        endereco: { endereco: "Rua Exemplo, 100" },
      });

      expect(response.status).toBe(201);
      expect(response.body.data.nomeSolicitante).toBe(cidadao.user.nome);
      expect(response.body.data.emailSolicitante).toBe(cidadao.user.email);
    });

    it("TC34: Deve aceitar demanda com todos os obrigatórios no tamanho mínimo e retornar status 201", async () => {
      const response = await criarDemanda(cidadao.token, {
        titulo: "Bur",
        descricao: "Grand",
        categoria: "vias_publicas",
        endereco: { endereco: "R 1" },
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it("TC36: Deve recusar demanda com endereco.endereco de 2 caracteres sem persistir nada", async () => {
      const antes = await listarDemandas(cidadao.token, {});

      const response = await criarDemanda(cidadao.token, {
        ...camposValidos,
        endereco: { endereco: "R1" },
      });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");

      const depois = await listarDemandas(cidadao.token, {});
      expect(depois.body.data.length).toBe(antes.body.data.length);
    });
  });

  describe("GET /api/demands - Filtros", () => {
    // Usuário próprio: o cidadão só enxerga as suas demandas, então o resultado do filtro é exato.
    let autor: AuthSession;
    const ids: Record<"d1" | "d2" | "d3", string> = { d1: "", d2: "", d3: "" };

    beforeAll(async () => {
      autor = await createUniqueUser("cidadao", "hyngrid-filtros");
      const massa = {
        d1: { prioridade: "media", endereco: { endereco: "Rua da Aurora, 1", bairro: "Boa Vista" } },
        d2: { prioridade: "alta", endereco: { endereco: "Av. Boa Viagem, 2", bairro: "Boa Viagem" } },
        d3: { prioridade: "baixa", endereco: { endereco: "Rua da Imperatriz, 3", bairro: "Boa Vista" } },
      };
      for (const [chave, dados] of Object.entries(massa)) {
        const response = await criarDemanda(autor.token, { ...camposValidos, ...dados });
        ids[chave as keyof typeof ids] = response.body.data.id;
      }
    });

    it("TC57: Deve filtrar demandas por prioridade", async () => {
      const response = await listarDemandas(autor.token, { prioridade: "baixa" });

      expect(response.status).toBe(200);
      expect(response.body.data.map((d: { id: string }) => d.id)).toEqual([ids.d3]);
    });

    it("TC58: Deve filtrar demandas por bairro", async () => {
      const response = await listarDemandas(autor.token, { bairro: "Boa Vista" });

      expect(response.status).toBe(200);
      expect(response.body.data.map((d: { id: string }) => d.id).sort()).toEqual([ids.d1, ids.d3].sort());
    });

    it("TC60: Deve combinar os filtros status e categoria (E)", async () => {
      const registrar = async (categoria: string, status: string) => {
        const criada = await criarDemanda(autor.token, {
          ...camposValidos,
          categoria,
          endereco: { endereco: "Rua Exemplo, 100" },
        });
        await request(app)
          .patch(`/api/demands/${criada.body.data.id}/status`)
          .set("Authorization", `Bearer ${gestorToken}`)
          .send({ status });
        return criada.body.data.id as string;
      };
      const alvo = await registrar("vias_publicas", "registrada");
      const outraCategoria = await registrar("saneamento", "registrada");
      const outroStatus = await registrar("vias_publicas", "em_analise");

      const response = await listarDemandas(gestorToken, { status: "registrada", categoria: "vias_publicas" });

      expect(response.status).toBe(200);
      const data: { id: string; status: string; categoria: string }[] = response.body.data;
      const retornados = data.map((d) => d.id);
      expect(retornados).toContain(alvo);
      expect(retornados).not.toContain(outraCategoria);
      expect(retornados).not.toContain(outroStatus);
      data.forEach((d) => {
        expect(d.status).toBe("registrada");
        expect(d.categoria).toBe("vias_publicas");
      });
    });
  });
});
