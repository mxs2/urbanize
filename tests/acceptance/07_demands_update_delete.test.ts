import request from "supertest";
import { app } from "../../backend/src/app";
import { getCidadaoSession, getGestorSession, createUniqueUser } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

const payload = {
  titulo: "Buraco na rua",
  descricao: "Buraco grande no meio da pista.",
  categoria: "vias_publicas",
  endereco: { endereco: "Rua do Sol, 10", bairro: "Boa Vista", cidade: "Recife" },
};

describe("SUT API Tests - Edição e exclusão de demandas (PATCH/DELETE /api/demands/:id)", () => {
  let cidadaoToken: string;
  let gestorToken: string;

  const createDemand = async (token = cidadaoToken) => {
    const res = await request(app).post("/api/demands").set("Authorization", `Bearer ${token}`).send(payload);
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  beforeAll(async () => {
    cidadaoToken = (await getCidadaoSession()).token;
    gestorToken = (await getGestorSession()).token;
  });

  afterAll(async () => {
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  it("cidadão edita a própria demanda e o histórico registra a edição", async () => {
    const id = await createDemand();

    const res = await request(app)
      .patch(`/api/demands/${id}`)
      .set("Authorization", `Bearer ${cidadaoToken}`)
      .send({ titulo: "Buraco enorme na rua", endereco: { bairro: "Santo Amaro" } });

    expect(res.status).toBe(200);
    expect(res.body.data.titulo).toBe("Buraco enorme na rua");
    expect(res.body.data.endereco.bairro).toBe("Santo Amaro");
    expect(res.body.data.historico.some((h: { descricao: string }) => h.descricao === "Demanda editada")).toBe(true);
  });

  it("rejeita edição sem nenhum campo (422)", async () => {
    const id = await createDemand();
    const res = await request(app)
      .patch(`/api/demands/${id}`)
      .set("Authorization", `Bearer ${cidadaoToken}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it("outro cidadão não edita nem exclui a demanda alheia (403)", async () => {
    const id = await createDemand();
    const other = await createUniqueUser("cidadao");

    const patch = await request(app)
      .patch(`/api/demands/${id}`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ titulo: "Invasor" });
    const del = await request(app).delete(`/api/demands/${id}`).set("Authorization", `Bearer ${other.token}`);

    expect(patch.status).toBe(403);
    expect(del.status).toBe(403);
  });

  it("cidadão não edita nem exclui demanda já em atendimento (409)", async () => {
    const id = await createDemand();
    await request(app)
      .patch(`/api/demands/${id}/status`)
      .set("Authorization", `Bearer ${gestorToken}`)
      .send({ status: "em_atendimento" });

    const patch = await request(app)
      .patch(`/api/demands/${id}`)
      .set("Authorization", `Bearer ${cidadaoToken}`)
      .send({ titulo: "Tarde demais" });
    const del = await request(app).delete(`/api/demands/${id}`).set("Authorization", `Bearer ${cidadaoToken}`);

    expect(patch.status).toBe(409);
    expect(del.status).toBe(409);
  });

  it("cidadão exclui a própria demanda e ela deixa de existir (404)", async () => {
    const id = await createDemand();

    const del = await request(app).delete(`/api/demands/${id}`).set("Authorization", `Bearer ${cidadaoToken}`);
    const get = await request(app).get(`/api/demands/${id}`).set("Authorization", `Bearer ${cidadaoToken}`);

    expect(del.status).toBe(200);
    expect(get.status).toBe(404);
  });

  it("gestor exclui qualquer demanda, mesmo em atendimento", async () => {
    const id = await createDemand();
    await request(app)
      .patch(`/api/demands/${id}/status`)
      .set("Authorization", `Bearer ${gestorToken}`)
      .send({ status: "em_atendimento" });

    const del = await request(app).delete(`/api/demands/${id}`).set("Authorization", `Bearer ${gestorToken}`);
    expect(del.status).toBe(200);
  });

  it("exige autenticação (401)", async () => {
    const res = await request(app).delete("/api/demands/qualquer");
    expect(res.status).toBe(401);
  });
});
