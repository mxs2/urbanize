import fs from "fs";
import path from "path";
import request from "supertest";
import os from "os";
import { app } from "../../backend/src/app";
import { env } from "../../backend/src/config/env";
import { UPLOAD_DIR } from "../../backend/src/middlewares/uploadAccessMiddleware";
import { retentionService } from "../../backend/src/services/retentionService";
import { getGestorSession } from "./helpers/authHelper";
import { testDb } from "./helpers/testDb";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const emailUnico = () => `lgpd-${Date.now()}-${Math.floor(Math.random() * 1e6)}@urbanize.test`;
const SENHA = "senhaSegura123";

const cadastrar = async () => {
  const email = emailUnico();
  const res = await request(app)
    .post("/api/auth/register")
    .send({ nome: "Titular Teste", email, senha: SENHA, telefone: "81999990000" });
  return { email, token: res.body.data.token as string, id: res.body.data.user.id as string };
};

const criarDemanda = async (token: string, extra: object = {}) => {
  const res = await request(app)
    .post("/api/demands")
    .set(bearer(token))
    .send({
      titulo: "Demanda LGPD",
      descricao: "Demanda usada nos testes de privacidade.",
      categoria: "zeladoria",
      telefoneSolicitante: "81999990000",
      endereco: { endereco: "Rua Exemplo, 1", bairro: "Boa Vista", referencia: "Casa azul", latitude: -8, longitude: -34 },
      ...extra,
    });
  expect(res.status).toBe(201);
  return res.body.data.id as string;
};

const buscar = (id: string) =>
  testDb.prisma.demand.findUniqueOrThrow({ where: { id }, include: { historico: true } });

describe("SUT API Tests - Entrega 3 (LGPD)", () => {
  const demandas: string[] = [];
  const backupDir = env.backupDir;

  beforeAll(() => {
    env.backupDir = fs.mkdtempSync(path.join(os.tmpdir(), "urbanize-lgpd-"));
  });

  afterAll(async () => {
    fs.rmSync(env.backupDir, { recursive: true, force: true });
    env.backupDir = backupDir;
    await testDb.prisma.demand.deleteMany({ where: { id: { in: demandas } } });
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  const demanda = async (token: string, extra?: object) => {
    const id = await criarDemanda(token, extra);
    demandas.push(id);
    return id;
  };

  describe("RS18 - Cópia dos dados", () => {
    it("TC120: Deve exportar só os dados do próprio titular, sem hash de senha nem tokens", async () => {
      const titular = await cadastrar();
      const outro = await cadastrar();
      const minha = await demanda(titular.token);
      await demanda(outro.token);

      const res = await request(app).get("/api/auth/me/dados").set(bearer(titular.token));

      expect(res.status).toBe(200);
      expect(res.body.data.usuario.email).toBe(titular.email);
      expect(res.body.data.demandas.map((d: { id: string }) => d.id)).toEqual([minha]);
      expect(JSON.stringify(res.body)).not.toMatch(/senhaHash|tokenHash/);
    });

    it("TC121: Deve exigir autenticação", async () => {
      expect((await request(app).get("/api/auth/me/dados")).status).toBe(401);
    });
  });

  describe("RS19 - Correção dos dados", () => {
    it("TC122: Deve corrigir a conta e as cópias nas demandas, sem alterar updatedAt", async () => {
      const titular = await cadastrar();
      const id = await demanda(titular.token);
      const antes = await buscar(id);
      const novoEmail = emailUnico();

      const res = await request(app)
        .patch("/api/auth/me")
        .set(bearer(titular.token))
        .send({ nome: "Nome Corrigido", email: novoEmail, telefone: "81888880000", senhaAtual: SENHA });

      expect(res.status).toBe(200);
      const depois = await buscar(id);
      expect(depois.nomeSolicitante).toBe("Nome Corrigido");
      expect(depois.emailSolicitante).toBe(novoEmail);
      expect(depois.telefoneSolicitante).toBe("81888880000");
      expect(depois.updatedAt).toEqual(antes.updatedAt);
    });

    it("TC123: Deve exigir a senha atual para trocar o e-mail", async () => {
      const titular = await cadastrar();
      const res = await request(app).patch("/api/auth/me").set(bearer(titular.token)).send({ email: emailUnico() });
      expect(res.status).toBe(403);
    });

    it("TC124: Deve recusar e-mail de outra conta", async () => {
      const titular = await cadastrar();
      const outro = await cadastrar();
      const res = await request(app)
        .patch("/api/auth/me")
        .set(bearer(titular.token))
        .send({ email: outro.email, senhaAtual: SENHA });
      expect(res.status).toBe(409);
    });
  });

  describe("RS17/RS13 - Exclusão da conta", () => {
    const excluir = (token: string, senha: string) =>
      request(app).delete("/api/auth/me").set(bearer(token)).send({ senha });

    it("TC125: Deve excluir a conta, anonimizar a demanda e apagar a foto", async () => {
      const titular = await cadastrar();
      const arquivo = `lgpd-${Date.now()}.jpg`;
      const caminho = path.join(UPLOAD_DIR, arquivo);
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(caminho, "foto");
      const id = await demanda(titular.token, { imagemUrl: `/uploads/${arquivo}` });
      const antes = await buscar(id);

      expect((await excluir(titular.token, SENHA)).status).toBe(200);

      const depois = await buscar(id);
      expect(depois).toMatchObject({
        userId: null,
        nomeSolicitante: "Anônimo",
        emailSolicitante: "anonimo@urbanize.invalid",
        telefoneSolicitante: null,
        referencia: null,
        latitude: null,
        longitude: null,
        imagemUrl: null,
        bairro: "Boa Vista",
        categoria: antes.categoria,
        status: antes.status,
      });
      expect(depois.historico.find((h) => h.status === "registrada")?.autor).toBe("Anônimo");
      expect(depois.updatedAt).toEqual(antes.updatedAt);
      expect(fs.existsSync(caminho)).toBe(false);
      expect(await testDb.prisma.user.findUnique({ where: { id: titular.id } })).toBeNull();
      expect((await request(app).get("/api/auth/me").set(bearer(titular.token))).status).toBe(401);
    });

    it("TC126: Não deve excluir com senha errada", async () => {
      const titular = await cadastrar();
      expect((await excluir(titular.token, "errada123")).status).toBe(403);
      expect(await testDb.prisma.user.findUnique({ where: { id: titular.id } })).not.toBeNull();
    });

    it("TC127: Não deve permitir que um gestor exclua a própria conta por esta rota", async () => {
      const { token } = await getGestorSession();
      expect((await excluir(token, "demo")).status).toBe(403);
    });
  });

  describe("Descredenciamento de gestor", () => {
    let geral: string;
    let orgaos: Array<{ id: string; sigla: string }>;

    beforeAll(async () => {
      geral = (await getGestorSession()).token;
      orgaos = (await request(app).get("/api/organs").set(bearer(geral))).body.data;
    });

    const criarGestor = async (sigla: string) => {
      const pessoa = await cadastrar();
      const organId = orgaos.find((o) => o.sigla === sigla)!.id;
      const res = await request(app).post("/api/auth/gestores").set(bearer(geral)).send({ email: pessoa.email, organId });
      expect(res.status).toBe(200);
      return pessoa;
    };
    const descredenciar = (token: string, email: string) =>
      request(app).delete("/api/auth/gestores").set(bearer(token)).send({ email });
    const papel = async (id: string) => (await testDb.prisma.user.findUniqueOrThrow({ where: { id } })).role;

    it("TC130: Deve voltar o gestor a cidadão, encerrar a sessão, auditar e permitir a exclusão", async () => {
      const chefe = await criarGestor("SEINFRA");
      const saindo = await criarGestor("SEINFRA");

      const res = await descredenciar(chefe.token, saindo.email);

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe("cidadao");
      expect(res.body.data.user.organId).toBeUndefined();
      expect((await request(app).get("/api/auth/me").set(bearer(saindo.token))).status).toBe(401);
      expect(
        await testDb.prisma.auditLog.count({ where: { evento: "troca_papel", userId: chefe.id, alvoId: saindo.id } })
      ).toBe(1);

      const login = await request(app).post("/api/auth/login").send({ email: saindo.email, senha: SENHA });
      const exclusao = await request(app)
        .delete("/api/auth/me")
        .set(bearer(login.body.data.token))
        .send({ senha: SENHA });
      expect(exclusao.status).toBe(200);
    });

    it("TC131: Gestor de órgão não deve descredenciar gestor de outro órgão", async () => {
      const chefe = await criarGestor("SEINFRA");
      const deFora = await criarGestor("COMPESA");

      expect((await descredenciar(chefe.token, deFora.email)).status).toBe(403);
      expect(await papel(deFora.id)).toBe("gestor");
    });

    it("TC132: Não deve permitir descredenciar a si mesmo nem uma conta de acesso geral", async () => {
      const chefe = await criarGestor("SEINFRA");

      expect((await descredenciar(chefe.token, chefe.email)).status).toBe(403);
      expect((await descredenciar(chefe.token, "gestor@urbanize.com")).status).toBe(403);
      expect(await papel(chefe.id)).toBe("gestor");
    });

    it("TC133: Cidadão não deve descredenciar ninguém", async () => {
      const gestor = await criarGestor("SEINFRA");
      const cidadao = await cadastrar();

      expect((await descredenciar(cidadao.token, gestor.email)).status).toBe(403);
    });
  });

  describe("RS20 - Prazo de guarda", () => {
    const encerrar = async (id: string, meses: number) => {
      const data = new Date();
      data.setMonth(data.getMonth() - meses);
      await testDb.prisma.demand.update({
        where: { id },
        data: { status: "resolvida", historico: { create: { status: "resolvida", descricao: "ok", autor: "Gestor", createdAt: data } } },
      });
    };

    it("TC128: Deve anonimizar o contato só das demandas encerradas há mais de 12 meses", async () => {
      const titular = await cadastrar();
      const antiga = await demanda(titular.token);
      const recente = await demanda(titular.token);
      await encerrar(antiga, 13);
      await encerrar(recente, 11);

      await retentionService.apply();

      expect(await buscar(antiga)).toMatchObject({ nomeSolicitante: "Anônimo", telefoneSolicitante: null, latitude: -8 });
      expect((await buscar(recente)).nomeSolicitante).toBe("Titular Teste");
    });
  });

  describe("RS21 - Auditoria", () => {
    it("TC129: Deve registrar cadastro, falha e sucesso de login e exclusão, sem dados sensíveis", async () => {
      const titular = await cadastrar();
      await request(app).post("/api/auth/login").send({ email: titular.email, senha: "errada123" });
      const login = await request(app).post("/api/auth/login").send({ email: titular.email, senha: SENHA });
      await request(app).delete("/api/auth/me").set(bearer(login.body.data.token)).send({ senha: SENHA });

      const registros = await testDb.prisma.auditLog.findMany({ where: { userId: titular.id } });

      expect(registros.map((r) => r.evento).sort()).toEqual(
        ["cadastro", "exclusao_conta", "login_falha", "login_sucesso"].sort()
      );
      expect(JSON.stringify(registros)).not.toContain(titular.email);
      expect(JSON.stringify(registros)).not.toContain(SENHA);
    });
  });
});
