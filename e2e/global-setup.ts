import { execFileSync } from "node:child_process";
import path from "node:path";

// Remove demandas criadas por execuções anteriores do teste E2E (ver
// backend/scripts/e2eCleanup.ts) antes de cada rodada, pra listagem não acumular repetições.
export default function globalSetup() {
  const backendDir = path.join(__dirname, "..", "backend");
  const tsxCli = path.join(backendDir, "node_modules", "tsx", "dist", "cli.mjs");
  execFileSync(process.execPath, [tsxCli, "scripts/e2eCleanup.ts"], {
    cwd: backendDir,
    stdio: "inherit",
  });
}
