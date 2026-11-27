import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";

const FILE = "contas-excluidas.log";

/**
 * Registro das contas excluídas, fora do banco: um backup anterior à exclusão ainda tem a
 * conta, e a restauração usa esta lista para excluí-la de novo. Guarda só o identificador.
 */
export const erasureLedger = {
  async add(userId: string) {
    for (const dir of [env.backupDir, env.backupOffsiteDir]) {
      if (!dir) continue;
      try {
        await fs.mkdir(dir, { recursive: true });
        await fs.appendFile(path.join(dir, FILE), `${userId}\n`, { mode: 0o600 });
      } catch (error) {
        // A conta já foi excluída; a falha precisa aparecer para a equipe anotar o id.
        console.error(`Falha ao registrar a exclusão da conta ${userId} em ${dir}.`, error);
      }
    }
  },

  /** União das duas cópias, para valer mesmo se um dos discos foi perdido. */
  async list() {
    const ids = new Set<string>();
    for (const dir of [env.backupDir, env.backupOffsiteDir]) {
      if (!dir) continue;
      try {
        const content = await fs.readFile(path.join(dir, FILE), "utf8");
        content.split("\n").filter(Boolean).forEach((id) => ids.add(id.trim()));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    return [...ids];
  },
};
