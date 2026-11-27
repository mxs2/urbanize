import request from "supertest";
import { app } from "../../backend/src/app";
import { env } from "../../backend/src/config/env";
import { createUniqueUser, getCidadaoSession, getGestorSession } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const emailUnico = (prefixo: string) => `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@urbanize.test`;

const cadastrar = async (email = emailUnico("sessao"), senha = "senhaSegura123") => {
  const res = await request(app).post("/api/auth/register").send({ nome: "Pessoa Teste", email, senha });
  return { res, email, ...(res.body.data ?? {}) } as {
    res: request.Response;
    email: string;
    token: string;
    refreshToken: string;
  };
};

describe("SUT API Tests - Entrega 1 (senhas, limites, sessão e papéis)", () => {
  let gestorGeral: string;
  let orgaos: Array<{ id: string; sigla: string }>;

  beforeAll(async () => {
    gestorGeral = (await getGestorSession()).token;
    orgaos = (await request(app).get("/api/organs").set(bearer(gestorGeral))).body.data;
  });

  afterAll(async () => {
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  const orgao = (sigla: string) => orgaos.find((o) => o.sigla === sigla)!.id;

  /** Cadastra e promove, como um gestor faria de verdade. */
  const criarGestor = async (sigla: string) => {
    const pessoa = await cadastrar(emailUnico("gestor"));
    const promocao = await request(app)
      .post("/api/auth/gestores")
      .set(bearer(gestorGeral))
      .send({ email: pessoa.email, organId: orgao(sigla) });
    expect(promocao.status).toBe(200);
    return pessoa;
  };

  const criarDemanda = async (categoria: string) => {
    const { token } = await getCidadaoSession();
    const dono = await createUniqueUser("cidadao", "dono");
    const res = await request(app)
      .post("/api/demands")
      .set(bearer(dono.token || token))
      .send({
        titulo: "Demanda de escopo",
        descricao: "Demanda usada para testar o escopo por órgão.",
        categoria,
        endereco: { endereco: "Rua Exemplo, 1" },
      });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  };

  describe("RS02 - Senhas", () => {
    it.each([
      ["TC105", "curta", "abc1234"],
      ["TC106", "sem número", "somenteletras"],
      ["TC107", "sem letra", "12345678"],
      ["TC108", "maior que o limite do bcrypt", `a1${"x".repeat(71)}`],
    ])("%s: Deve recusar senha %s no cadastro", async (_id, _caso, senha) => {
      const { res } = await cadastrar(emailUnico("senha"), senha);
      expect(res.status).toBe(422);
    });

    it("TC109: Deve continuar aceitando no login a conta antiga com senha curta", async () => {
      const res = await request(app).post("/api/auth/login").send({ email: "cidadao@urbanize.com", senha: "demo" });
      expect(res.status).toBe(200);
    });
  });

  describe("RS03 - Limite de tentativas", () => {
    beforeAll(() => {
      env.authRateLimit = true;
    });
    afterAll(() => {
      env.authRateLimit = false;
    });

    it("TC110: Deve bloquear a conta com 429 depois de 10 senhas erradas", async () => {
      const email = emailUnico("forca-bruta");
      const tentar = () => request(app).post("/api/auth/login").send({ email, senha: "errada123" });
      for (let i = 0; i < 10; i += 1) expect((await tentar()).status).toBe(401);

      const bloqueada = await tentar();
      expect(bloqueada.status).toBe(429);
      expect(bloqueada.body.error.code).toBe("TOO_MANY_REQUESTS");
    });
  });

  describe("RS04 - Renovação e revogação de sessão", () => {
    const renovar = (refreshToken: string) => request(app).post("/api/auth/refresh").send({ refreshToken });
    const eu = (token: string) => request(app).get("/api/auth/me").set(bearer(token));

    it("TC111: Deve trocar o refresh token por um novo par de tokens", async () => {
      const sessao = await cadastrar();
      const res = await renovar(sessao.refreshToken);

      expect(res.status).toBe(200);
      expect(res.body.data.refreshToken).not.toBe(sessao.refreshToken);
      expect((await eu(res.body.data.token)).status).toBe(200);
    });

    it("TC112: Deve encerrar a sessão inteira quando um refresh token usado é reapresentado", async () => {
      const sessao = await cadastrar();
      const nova = (await renovar(sessao.refreshToken)).body.data;

      expect((await renovar(sessao.refreshToken)).status).toBe(401);
      expect((await renovar(nova.refreshToken)).status).toBe(401);
      expect((await eu(nova.token)).body.error.code).toBe("SESSION_REVOKED");
    });

    it("TC113: Logout deve invalidar na hora o token de acesso e o refresh token", async () => {
      const sessao = await cadastrar();
      await request(app).post("/api/auth/logout").set(bearer(sessao.token)).send({ refreshToken: sessao.refreshToken });

      expect((await eu(sessao.token)).status).toBe(401);
      expect((await renovar(sessao.refreshToken)).status).toBe(401);
    });

    it("TC114: Deve recusar refresh token desconhecido", async () => {
      const res = await renovar("token-inventado");
      expect(res.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });
  });

  describe("RS06/RS07 - Gestor limitado ao seu órgão", () => {
    it("TC115: Gestor de órgão só deve listar e ver demandas do próprio órgão", async () => {
      const deVias = await criarDemanda("vias_publicas");
      const deLuz = await criarDemanda("iluminacao_publica");
      const { token } = await criarGestor("SEINFRA");

      const lista = await request(app).get("/api/demands").set(bearer(token));
      const ids = lista.body.data.map((d: { id: string }) => d.id);
      expect(ids).toContain(deVias);
      expect(ids).not.toContain(deLuz);

      expect((await request(app).get(`/api/demands/${deVias}`).set(bearer(token))).status).toBe(200);
      expect((await request(app).get(`/api/demands/${deLuz}`).set(bearer(token))).status).toBe(403);
    });

    it("TC116: Gestor de órgão não deve alterar status de demanda de outro órgão", async () => {
      const deLuz = await criarDemanda("iluminacao_publica");
      const { token } = await criarGestor("SEINFRA");

      const res = await request(app)
        .patch(`/api/demands/${deLuz}/status`)
        .set(bearer(token))
        .send({ status: "resolvida" });
      expect(res.status).toBe(403);
    });

    it("TC117: Métricas do gestor de órgão devem bater com a listagem dele", async () => {
      await criarDemanda("vias_publicas");
      const { token } = await criarGestor("SEINFRA");

      const lista = await request(app).get("/api/demands").set(bearer(token));
      const metricas = await request(app).get("/api/metrics/summary").set(bearer(token));
      expect(metricas.body.data.total).toBe(lista.body.data.length);
    });
  });

  describe("Novos gestores", () => {
    const promover = (token: string, body: object) =>
      request(app).post("/api/auth/gestores").set(bearer(token)).send(body);

    it("TC118: Cidadão não deve conseguir promover ninguém", async () => {
      const cidadao = await cadastrar();
      const res = await promover(cidadao.token, { email: cidadao.email, organId: orgao("SEINFRA") });
      expect(res.status).toBe(403);
    });

    it("TC119: Gestor de órgão só deve promover para o próprio órgão e não concede acesso geral", async () => {
      const chefe = await criarGestor("SEINFRA");
      const pessoa = await cadastrar();

      expect((await promover(chefe.token, { email: pessoa.email, organId: orgao("COMPESA") })).status).toBe(403);

      const res = await promover(chefe.token, { email: pessoa.email, acessoGeral: true });
      expect(res.status).toBe(200);
      expect(res.body.data.user.organId).toBe(orgao("SEINFRA"));
      const salvo = await testDb.prisma.user.findUnique({ where: { email: pessoa.email } });
      expect(salvo?.acessoGeral).toBe(false);
    });
  });
});
