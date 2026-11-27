import request from "supertest";
import { app } from "../../backend/src/app";
import { notificationService } from "../../backend/src/services/notificationService";
import { AuthSession, createUniqueUser, getGestorSession } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

const TOKEN = `ExponentPushToken[teste-${Date.now()}]`;

/** O envio é disparado sem await pela API; espera o dublê ser chamado. */
const waitFor = async (check: () => boolean, timeoutMs = 2000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error("Notificação não foi enviada a tempo.");
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

describe("SUT API Tests - Notificações push (/api/notifications)", () => {
  let cidadao: AuthSession;
  let gestorToken: string;
  const enviadas: Array<Record<string, unknown>> = [];

  beforeAll(async () => {
    cidadao = await createUniqueUser("cidadao", "push");
    gestorToken = (await getGestorSession()).token;
    notificationService.setSenderForTests(async (messages) => {
      enviadas.push(...(messages as Array<Record<string, unknown>>));
      return messages.map(() => ({ status: "ok" as const }));
    });
  });

  afterAll(async () => {
    notificationService.setSenderForTests(null);
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  it("registra o token Expo do aparelho do cidadão", async () => {
    const response = await request(app)
      .post("/api/notifications/token")
      .set("Authorization", `Bearer ${cidadao.token}`)
      .send({ token: TOKEN, platform: "android" });

    expect(response.status).toBe(201);
    const stored = await testDb.prisma.pushToken.findUnique({ where: { token: TOKEN } });
    expect(stored?.userId).toBe(cidadao.user.id);
  });

  it("rejeita token que não é do Expo", async () => {
    const response = await request(app)
      .post("/api/notifications/token")
      .set("Authorization", `Bearer ${cidadao.token}`)
      .send({ token: "qualquer-coisa" });

    expect(response.status).toBe(422);
  });

  it("exige autenticação para registrar token", async () => {
    const response = await request(app).post("/api/notifications/token").send({ token: TOKEN });

    expect(response.status).toBe(401);
  });

  it("notifica o autor quando o gestor muda o status da demanda", async () => {
    const criada = await request(app)
      .post("/api/demands")
      .set("Authorization", `Bearer ${cidadao.token}`)
      .send({
        titulo: "Poste apagado",
        descricao: "Poste apagado há uma semana",
        categoria: "iluminacao_publica",
        endereco: { endereco: "Rua da Aurora, 100", bairro: "Boa Vista" },
      });
    const demanda = criada.body.data;

    const atualizada = await request(app)
      .patch(`/api/demands/${demanda.id}/status`)
      .set("Authorization", `Bearer ${gestorToken}`)
      .send({ status: "em_atendimento", observacaoGestor: "Equipe a caminho" });

    expect(atualizada.status).toBe(200);
    await waitFor(() => enviadas.some((m) => m.to === TOKEN));

    const mensagem = enviadas.find((m) => m.to === TOKEN)!;
    expect(mensagem.title).toBe(`Demanda ${demanda.protocolo} em atendimento`);
    expect(mensagem.data).toEqual({ demandId: demanda.id, status: "em_atendimento" });
  });

  it("remove o token no logout do aparelho", async () => {
    const response = await request(app)
      .delete("/api/notifications/token")
      .set("Authorization", `Bearer ${cidadao.token}`)
      .send({ token: TOKEN });

    expect(response.status).toBe(200);
    expect(await testDb.prisma.pushToken.findUnique({ where: { token: TOKEN } })).toBeNull();
  });
});
