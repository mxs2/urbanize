import fs from "fs";
import os from "os";
import path from "path";
import request from "supertest";
import { app } from "../../backend/src/app";
import { env } from "../../backend/src/config/env";
import { backupService, expiredBackups } from "../../backend/src/services/backupService";
import { erasureLedger } from "../../backend/src/services/erasureLedger";
import { testDb } from "./helpers/testDb";

describe("SUT API Tests - Entrega 5 (backup e continuidade)", () => {
  const original = { key: env.backupKey, dir: env.backupDir, offsite: env.backupOffsiteDir };
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "urbanize-teste-"));

  beforeAll(() => {
    env.backupKey = "ab".repeat(32);
    env.backupDir = path.join(root, "local");
    env.backupOffsiteDir = path.join(root, "remoto");
  });

  afterAll(async () => {
    env.backupKey = original.key;
    env.backupDir = original.dir;
    env.backupOffsiteDir = original.offsite;
    fs.rmSync(root, { recursive: true, force: true });
    await testDb.cleanTestData();
    await testDb.disconnect();
  });

  it("TC135: Deve gerar backup cifrado, com cópia fora do servidor, e passar no teste de restauração", async () => {
    const { file } = await backupService.create();

    const content = fs.readFileSync(file);
    expect(content.subarray(0, 4).toString()).toBe("URB1");
    expect(content.includes("SQLite format 3")).toBe(false);
    expect(fs.existsSync(path.join(env.backupOffsiteDir!, path.basename(file)))).toBe(true);

    const result = await backupService.verify(file);
    expect(result.integrity).toBe("ok");
    expect(result.usuarios).toBeGreaterThan(0);

    const target = path.join(root, "extraido");
    await backupService.extract(file, target);
    expect(fs.existsSync(path.join(target, "database.db"))).toBe(true);
  });

  it("TC136: Deve recusar chave errada e arquivo adulterado", async () => {
    const { file } = await backupService.create();

    env.backupKey = "cd".repeat(32);
    await expect(backupService.verify(file)).rejects.toThrow();
    env.backupKey = "ab".repeat(32);

    const content = fs.readFileSync(file);
    content[40] ^= 1;
    fs.writeFileSync(file, content);
    await expect(backupService.verify(file)).rejects.toThrow();
  });

  it("TC137: Não deve gerar backup sem chave", async () => {
    env.backupKey = null;
    await expect(backupService.create()).rejects.toThrow("BACKUP_ENCRYPTION_KEY");
    env.backupKey = "ab".repeat(32);
  });

  it("TC138: Deve manter 7 dias de diários e 4 semanas de semanais", () => {
    const now = new Date("2026-11-27T12:00:00Z");
    const nome = (diasAtras: number) =>
      `urbanize-${new Date(now.getTime() - diasAtras * 86_400_000).toISOString().slice(0, 10)}T02-00-00Z.tar.gz.enc`;
    const todos = Array.from({ length: 60 }, (_, dia) => nome(dia));

    const expirados = new Set(expiredBackups([...todos, "contas-excluidas.log"], now));
    const mantidos = todos.filter((item) => !expirados.has(item));

    for (let dia = 0; dia < 7; dia += 1) expect(mantidos).toContain(nome(dia));
    expect(mantidos.length).toBeLessThanOrEqual(11);
    for (let dia = 28; dia < 60; dia += 1) expect(mantidos).not.toContain(nome(dia));
    // Segundas-feiras dentro das 4 semanas.
    expect(mantidos).toEqual(expect.arrayContaining([nome(11), nome(18), nome(25)]));
    expect(expirados.has("contas-excluidas.log")).toBe(false);
  });

  it("TC139: Deve anotar a conta excluída nas duas cópias, só com o identificador", async () => {
    const email = `backup-${Date.now()}@urbanize.test`;
    const cadastro = await request(app)
      .post("/api/auth/register")
      .send({ nome: "Titular Backup", email, senha: "senhaSegura123" });

    await request(app)
      .delete("/api/auth/me")
      .set({ Authorization: `Bearer ${cadastro.body.data.token}` })
      .send({ senha: "senhaSegura123" });

    expect(await erasureLedger.list()).toContain(cadastro.body.data.user.id);
    for (const dir of [env.backupDir, env.backupOffsiteDir!]) {
      const log = fs.readFileSync(path.join(dir, "contas-excluidas.log"), "utf8");
      expect(log).toContain(cadastro.body.data.user.id);
      expect(log).not.toContain(email);
    }
  });
});
