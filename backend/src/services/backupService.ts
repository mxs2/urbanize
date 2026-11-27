import { execFile } from "child_process";
import crypto from "crypto";
import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { pipeline } from "stream/promises";
import { promisify } from "util";
import Database from "better-sqlite3";
import { env } from "../config/env";
import { UPLOAD_DIR } from "../middlewares/uploadAccessMiddleware";

const run = promisify(execFile);

const MAGIC = Buffer.from("URB1");
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const NAME = /^urbanize-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z\.tar\.gz\.enc$/;
const DAY = 86_400_000;

export const databasePath = () => path.resolve((process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""));

const encryptionKey = () => {
  if (!env.backupKey || !/^[0-9a-f]{64}$/i.test(env.backupKey)) {
    throw new Error("BACKUP_ENCRYPTION_KEY precisa ter 64 caracteres hexadecimais (openssl rand -hex 32).");
  }
  return Buffer.from(env.backupKey, "hex");
};

/** O conteúdo decifrado tem dados pessoais: pasta temporária privada, apagada ao final. */
export const withTempDir = async <T>(task: (dir: string) => Promise<T>) => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "urbanize-backup-"));
  try {
    return await task(dir);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
};

/** AES-256-GCM: `URB1 | iv | conteúdo | tag`. */
const encrypt = async (source: string, target: string) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  await fsp.writeFile(target, Buffer.concat([MAGIC, iv]), { mode: 0o600 });
  await pipeline(fs.createReadStream(source), cipher, fs.createWriteStream(target, { flags: "a" }));
  await fsp.appendFile(target, cipher.getAuthTag());
};

/** Falha com chave errada ou arquivo alterado. */
const decrypt = async (source: string, target: string) => {
  const { size } = await fsp.stat(source);
  const header = Buffer.alloc(MAGIC.length + IV_LENGTH);
  const tag = Buffer.alloc(TAG_LENGTH);
  const file = await fsp.open(source, "r");
  try {
    await file.read(header, 0, header.length, 0);
    await file.read(tag, 0, TAG_LENGTH, size - TAG_LENGTH);
  } finally {
    await file.close();
  }
  if (size <= header.length + TAG_LENGTH || !header.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error(`${source} não é um backup do Urbanize.`);
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), header.subarray(MAGIC.length));
  decipher.setAuthTag(tag);
  await pipeline(
    fs.createReadStream(source, { start: header.length, end: size - TAG_LENGTH - 1 }),
    decipher,
    fs.createWriteStream(target, { mode: 0o600 })
  );
};

const weekOf = (date: Date) => {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
};

/**
 * RS29: o último de cada dia por 7 dias e o primeiro de cada semana por 4 semanas. Pela
 * idade, e não pela quantidade: nenhum backup (e os dados nele) passa de 28 dias.
 */
export const expiredBackups = (names: string[], now = new Date()) => {
  const backups = names
    .flatMap((name) => {
      const match = name.match(NAME);
      return match ? [{ name, date: new Date(`${match[1]}T${match[2]}:${match[3]}:${match[4]}Z`) }] : [];
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const daily = new Map<string, string>();
  const weekly = new Map<string, string>();
  for (const { name, date } of backups) {
    const age = now.getTime() - date.getTime();
    if (age < 7 * DAY) daily.set(date.toISOString().slice(0, 10), name);
    if (age < 28 * DAY && !weekly.has(weekOf(date))) weekly.set(weekOf(date), name);
  }
  const keep = new Set([...daily.values(), ...weekly.values()]);
  return backups.filter(({ name }) => !keep.has(name)).map(({ name }) => name);
};

const prune = async (dir: string, now: Date) => {
  const expired = expiredBackups(await fsp.readdir(dir), now);
  await Promise.all(expired.map((name) => fsp.rm(path.join(dir, name), { force: true })));
  return expired.length;
};

export const backupService = {
  /** RS26–RS28: banco e fotos em um arquivo cifrado, com cópia fora do servidor. */
  async create(now = new Date()) {
    encryptionKey();
    await fsp.mkdir(env.backupDir, { recursive: true });
    const name = `urbanize-${now.toISOString().slice(0, 19).replace(/:/g, "-")}Z.tar.gz.enc`;
    const target = path.join(env.backupDir, name);

    await withTempDir(async (dir) => {
      const content = path.join(dir, "content");
      await fsp.mkdir(path.join(content, "uploads"), { recursive: true });

      // API de backup do SQLite (o mesmo do `.backup`): cópia consistente com a API ligada.
      const database = new Database(databasePath(), { fileMustExist: true });
      try {
        await database.backup(path.join(content, "database.db"));
      } finally {
        database.close();
      }
      if (fs.existsSync(UPLOAD_DIR)) await fsp.cp(UPLOAD_DIR, path.join(content, "uploads"), { recursive: true });

      const archive = path.join(dir, "backup.tar.gz");
      await run("tar", ["-czf", archive, "-C", content, "."]);
      // Nome definitivo só ao terminar: um backup interrompido não passa por bom.
      await encrypt(archive, `${target}.part`);
      await fsp.rename(`${target}.part`, target);
    });

    const removed = await prune(env.backupDir, now);
    if (env.backupOffsiteDir) {
      await fsp.mkdir(env.backupOffsiteDir, { recursive: true });
      await fsp.copyFile(target, path.join(env.backupOffsiteDir, `${name}.part`));
      await fsp.rename(path.join(env.backupOffsiteDir, `${name}.part`), path.join(env.backupOffsiteDir, name));
      await prune(env.backupOffsiteDir, now);
    }

    return { file: target, offsite: Boolean(env.backupOffsiteDir), removed };
  },

  async latest(dir = env.backupDir) {
    const names = (await fsp.readdir(dir)).filter((name) => NAME.test(name)).sort();
    if (!names.length) throw new Error(`Nenhum backup em ${dir}.`);
    return path.join(dir, names[names.length - 1]);
  },

  /** Decifra e extrai em `target`, que passa a ter `database.db` e `uploads/`. */
  async extract(file: string, target: string) {
    await withTempDir(async (dir) => {
      const archive = path.join(dir, "backup.tar.gz");
      await decrypt(file, archive);
      await fsp.mkdir(target, { recursive: true });
      await run("tar", ["-xzf", archive, "-C", target]);
    });
  },

  /** RS30: restaura em uma pasta temporária e confere o conteúdo, sem tocar no sistema. */
  async verify(file: string) {
    return withTempDir(async (dir) => {
      await backupService.extract(file, dir);
      const database = new Database(path.join(dir, "database.db"), { readonly: true });
      try {
        const integrity = database.pragma("integrity_check", { simple: true }) as string;
        const count = (table: string) =>
          (database.prepare(`SELECT COUNT(*) AS total FROM "${table}"`).get() as { total: number }).total;
        const photos = database
          .prepare(`SELECT imagemUrl FROM "Demand" WHERE imagemUrl LIKE '/uploads/%'`)
          .all() as Array<{ imagemUrl: string }>;
        const missing = photos.filter(
          ({ imagemUrl }) => !fs.existsSync(path.join(dir, "uploads", path.basename(imagemUrl)))
        ).length;

        return {
          ok: integrity === "ok" && missing === 0,
          integrity,
          usuarios: count("User"),
          demandas: count("Demand"),
          fotos: photos.length,
          fotosAusentes: missing,
        };
      } finally {
        database.close();
      }
    });
  },

  /**
   * RS31: substitui banco e fotos pelo conteúdo do backup. A API precisa estar parada. O
   * que existia é renomeado, não apagado.
   */
  async restore(file: string, { force = false } = {}) {
    const database = databasePath();
    if (fs.existsSync(database) && !force) {
      throw new Error(`${database} já existe. Pare a API e use --force para substituí-lo.`);
    }

    await withTempDir(async (dir) => {
      await backupService.extract(file, dir);
      const suffix = `.antes-restauracao-${Date.now()}`;
      await fsp.mkdir(path.dirname(database), { recursive: true });
      if (fs.existsSync(database)) await fsp.rename(database, `${database}${suffix}`);
      // Sobras do banco antigo corromperiam o restaurado.
      for (const extra of ["-journal", "-wal", "-shm"]) await fsp.rm(`${database}${extra}`, { force: true });
      await fsp.copyFile(path.join(dir, "database.db"), database);

      await fsp.mkdir(UPLOAD_DIR, { recursive: true });
      // `cp` por cima, e não `rename`: a pasta pode ser um volume montado.
      await fsp.cp(path.join(dir, "uploads"), UPLOAD_DIR, { recursive: true });
    });
  },
};
