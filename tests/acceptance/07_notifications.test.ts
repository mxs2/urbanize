import request from "supertest";
import { app } from "../../backend/src/app";
import { createUniqueUser, getGestorSession } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

describe("SUT API Tests - Notificações ao cidadão (/api/notifications)", () => {
  afterAll(async () => {
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  it("cria aviso para o dono da demanda quando o gestor muda o status e permite marcá-lo como lido", async () => {
    const cidadao = await createUniqueUser("cidadao", "notif");
    const outro = await createUniqueUser("cidadao", "notif");
    const gestor = await getGestorSession();

    const criada = await request(app)
      .post("/api/demands")
      .set("Authorization", `Bearer ${cidadao.token}`)
      .send({
        titulo: "Semáforo desligado",
        descricao: "Semáforo do cruzamento está desligado desde cedo.",
        categoria: "vias_publicas",
        endereco: { endereco: "Av. Agamenon Magalhães, 100", bairro: "Derby", cidade: "Recife" },
      });
    expect(criada.status).toBe(201);
    const { id, protocolo } = criada.body.data;

    const vazio = await request(app).get("/api/notifications").set("Authorization", `Bearer ${cidadao.token}`);
    expect(vazio.body.data).toEqual([]);

    const patch = await request(app)
      .patch(`/api/demands/${id}/status`)
      .set("Authorization", `Bearer ${gestor.token}`)
      .send({ status: "encaminhada", observacaoGestor: "Equipe de trânsito acionada." });
    expect(patch.status).toBe(200);

    const lista = await request(app).get("/api/notifications").set("Authorization", `Bearer ${cidadao.token}`);
    expect(lista.status).toBe(200);
    expect(lista.body.data).toHaveLength(1);
    expect(lista.body.data[0]).toMatchObject({
      demandId: id,
      lida: false,
      mensagem: `Sua demanda ${protocolo} mudou para "Encaminhada". Equipe de trânsito acionada.`,
    });

    const alheia = await request(app).get("/api/notifications").set("Authorization", `Bearer ${outro.token}`);
    expect(alheia.body.data).toEqual([]);

    const lidas = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${cidadao.token}`);
    expect(lidas.body.data.atualizadas).toBe(1);

    const depois = await request(app).get("/api/notifications").set("Authorization", `Bearer ${cidadao.token}`);
    expect(depois.body.data[0].lida).toBe(true);
  });

  it("recusa listar avisos sem autenticação", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });
});
