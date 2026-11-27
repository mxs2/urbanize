// Grava o fluxo completo (tests/fluxo-completo.spec.ts) e converte cada etapa em GIF
// para docs/media/. Requer backend e app web rodando (como nos testes E2E) e ffmpeg no PATH.
//
//   npm run demo:gifs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(e2eDir, "..", "docs", "media");
const videoDir = fs.mkdtempSync(path.join(os.tmpdir(), "urbanize-demo-"));
const STAGES = ["1-cadastro", "2-registro", "3-filtros", "4-gestor", "5-notificacao"];

execFileSync("npx", ["playwright", "test", "tests/fluxo-completo.spec.ts", "--reporter=line"], {
  cwd: e2eDir,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DEMO_VIDEO_DIR: videoDir, SLOWMO: process.env.SLOWMO ?? "120" },
});

fs.mkdirSync(outDir, { recursive: true });
// Paleta própria por GIF e 10 fps: legível a 300px e com poucas centenas de KB.
const filter =
  "fps=10,scale=300:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];" +
  "[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle";

for (const stage of STAGES) {
  const output = path.join(outDir, `${stage}.gif`);
  // Pula o primeiro quadro branco, antes do app carregar.
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", "0.8", "-i", path.join(videoDir, `${stage}.webm`), "-vf", filter, output]);
  console.log(`${path.relative(process.cwd(), output)} (${Math.round(fs.statSync(output).size / 1024)} KB)`);
}

fs.rmSync(videoDir, { recursive: true, force: true });
