#!/usr/bin/env node
// Verificações automáticas da política de manutenção da TAS (docs/tas.md, seção 3).
//
// Uso: node scripts/manutencao/verificar.mjs [dir-resultados] [dir-saida]
//   Sem dir-resultados: só a análise estática do código de teste (roda em todo PR).
//   Com dir-resultados (mesmo layout do job "Qualidade"): também analisa os resultados da execução
//   (instáveis, quarentena, lentos, rastreabilidade e duplicação de nomes).
// Saída: manutencao.md e manutencao.json em dir-saida (padrão: relatorios/).
// Código de saída 1 quando há ERRO (regra da política violada); AVISOS não falham.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { lerJUnit } from "../qualidade/junit.mjs";

const RAIZ = resolve(import.meta.dirname, "..", "..");
const [dirResultados, dirSaida = "relatorios"] = process.argv.slice(2);

// Limites justificados em docs/tas.md (3.4 Revisão periódica).
const LENTO = { unitarios: 2, api: 5, e2e: 60 }; // segundos por teste
const PASTAS_TESTE = ["tests/unit", "tests/acceptance", "tests/bdd/features", "e2e/tests"];

const arquivos = (dir) =>
  existsSync(dir) ? readdirSync(dir, { recursive: true }).map((f) => join(dir, String(f))) : [];

const erros = [];
const avisos = [];
const info = {};

// ---------- 1. análise estática do código de teste ----------
const ISSUE = /#\d+/;
for (const pasta of PASTAS_TESTE) {
  for (const arq of arquivos(join(RAIZ, pasta)).filter((f) => /\.(ts|tsx|js|feature)$/.test(f))) {
    const rel = relative(RAIZ, arq).replaceAll("\\", "/");
    readFileSync(arq, "utf8")
      .split("\n")
      .forEach((linha, i) => {
        const onde = `\`${rel}:${i + 1}\``;
        if (/\b(it|test|describe)\.only\(|\bf(it|describe)\(/.test(linha))
          erros.push(`${onde} — \`.only\` esquecido: faz a suíte rodar só esse teste.`);
        const desligado = /\b(it|test|describe)\.(skip|fixme)\(|\bx(it|describe)\(|@quarentena|^\s*@skip\b/.test(linha);
        if (desligado && !ISSUE.test(linha))
          erros.push(`${onde} — teste desligado ou em quarentena sem issue (\`#NN\`) na mesma linha.`);
        else if (/@quarentena/.test(linha)) (info.quarentena ??= []).push(`${onde} ${linha.match(ISSUE)[0]}`);
      });
  }
}

// ---------- 2. análise dos resultados da execução ----------
if (dirResultados) {
  const casos = ["unitarios", "api", "e2e"].flatMap((suite) =>
    arquivos(join(dirResultados, suite))
      .filter((f) => f.endsWith(".xml") && !f.includes("quarentena"))
      .flatMap((f) => lerJUnit(readFileSync(f, "utf8")).map((c) => ({ ...c, suite }))),
  );

  // Instáveis: o Playwright reexecuta no CI (retries: 1) e marca "flaky" quem só passou na segunda tentativa.
  const instaveis = [];
  const coletar = (s, titulos = []) => {
    for (const sub of s.suites ?? []) coletar(sub, [...titulos, sub.title]);
    for (const spec of s.specs ?? [])
      for (const t of spec.tests ?? [])
        if (t.status === "flaky")
          instaveis.push({
            nome: [...titulos, spec.title].filter(Boolean).join(" › "),
            arquivo: spec.file,
            erro: (t.results.find((r) => r.status !== "passed")?.error?.message ?? "")
              .replace(/\u001b\[[0-9;]*m/g, "")
              .slice(0, 500),
          });
  };
  for (const f of arquivos(join(dirResultados, "e2e")).filter((f) => f.endsWith("resultados.json")))
    coletar(JSON.parse(readFileSync(f, "utf8")));
  info.instaveis = instaveis;
  for (const t of instaveis)
    avisos.push(`Teste instável (falhou e passou na reexecução): **${t.nome}** — abrir issue \`flaky\` (P3).`);

  // Quarentena: roda à parte, não bloqueia, mas o resultado continua visível.
  const quarentena = arquivos(join(dirResultados, "e2e"))
    .filter((f) => f.endsWith("junit-quarentena.xml"))
    .flatMap((f) => lerJUnit(readFileSync(f, "utf8")));
  for (const c of quarentena)
    avisos.push(
      c.status === "passou"
        ? `Em quarentena e **passando**: ${c.nome} — avaliar saída da quarentena.`
        : `Em quarentena e **${c.status}**: ${c.nome}.`,
    );

  // Lentos.
  for (const c of casos.filter((c) => c.tempo > LENTO[c.suite]).sort((a, b) => b.tempo - a.tempo))
    avisos.push(`Lento (${c.tempo.toFixed(1)} s > ${LENTO[c.suite]} s em ${c.suite}): ${c.nome}`);

  // Rastreabilidade: o nome do teste precisa citar o caso TCxx que ele automatiza.
  const semTc = casos.filter((c) => !/\bTC\d{2,3}\b/.test(`${c.classe} ${c.nome}`));
  info.semTc = semTc.map((c) => `${c.suite}: ${c.nome}`);
  if (semTc.length) avisos.push(`${semTc.length} teste(s) sem ID de caso de teste (TCxx) no nome — ver lista abaixo.`);

  // Duplicação: mesmo nome completo em mais de um teste.
  const vistos = new Map();
  for (const c of casos) vistos.set(`${c.suite}: ${c.classe} ${c.nome}`, (vistos.get(`${c.suite}: ${c.classe} ${c.nome}`) ?? 0) + 1);
  const duplicados = [...vistos].filter(([, n]) => n > 1);
  for (const [nome, n] of duplicados) avisos.push(`Nome duplicado (${n}x): ${nome}`);

  info.totais = { testes: casos.length, semTc: semTc.length, instaveis: instaveis.length, quarentena: quarentena.length };
}

// ---------- saída ----------
const lista = (itens) => itens.map((i) => `- ${i}`).join("\n");
const md = [
  `## Manutenção da TAS — ${erros.length ? "❌ violações da política" : avisos.length ? "⚠️ pontos de atenção" : "✅ sem pendências"}`,
  "",
  "Política: `docs/tas.md`. Erros falham o check; avisos viram issue na revisão periódica.",
  "",
  erros.length ? `### Erros (${erros.length})\n\n${lista(erros)}\n` : "",
  avisos.length ? `### Avisos (${avisos.length})\n\n${lista(avisos)}\n` : "",
  info.quarentena?.length ? `### Testes em quarentena\n\n${lista(info.quarentena)}\n` : "",
  info.semTc?.length
    ? `<details><summary>Testes sem TCxx no nome (${info.semTc.length})</summary>\n\n${lista(info.semTc)}\n\n</details>\n`
    : "",
].join("\n");

mkdirSync(dirSaida, { recursive: true });
writeFileSync(join(dirSaida, "manutencao.md"), md);
writeFileSync(join(dirSaida, "manutencao.json"), JSON.stringify({ erros, avisos, ...info }, null, 2));
console.log(md);
process.exit(erros.length ? 1 : 0);
