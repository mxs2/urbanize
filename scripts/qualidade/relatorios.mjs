#!/usr/bin/env node
// Lê os resultados da pipeline (JUnit XML + coverage-summary.json de cada suíte), calcula as
// métricas de qualidade definidas em docs/tests/metricas-de-qualidade.md e gera:
//   metricas.json, historico.json, relatorio-tecnico.html, relatorio-negocio.html,
//   resumo.md (Job Summary do Actions) e issue.md (corpo da issue aberta em caso de falha).
//
// Uso: node scripts/qualidade/relatorios.mjs <dir-resultados> <dir-saida>
//   <dir-resultados>/<nome-da-suite>/**  -> *.xml (JUnit) e coverage-summary.json
//   RESULTADO_<SUITE> (env, opcional)    -> resultado do job no Actions (success/failure/skipped/cancelled)
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..", "..");
const [dirResultados = "resultados", dirSaida = "relatorios"] = process.argv.slice(2);

// Metas (justificadas em docs/tests/metricas-de-qualidade.md).
const META = { aprovacao: 100, coberturaLinhas: 70, casosAutomatizados: 50 };
const HISTORICO_MAX = 30;
const SUITES = [
  { id: "unitarios", nome: "Unitários (mobile)" },
  { id: "api", nome: "API (Jest + BDD)" },
  { id: "e2e", nome: "E2E (Playwright)" },
];

// ---------- leitura ----------
const arquivos = (dir) =>
  existsSync(dir) ? readdirSync(dir, { recursive: true }).map((f) => join(dir, String(f))) : [];

const decodificar = (s = "") =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");

const atributo = (tag, nome) => decodificar(tag.match(new RegExp(`\\s${nome}="([^"]*)"`))?.[1]);

// ponytail: parser JUnit por regex; serve para os formatos de jest-junit, Cucumber e Playwright.
// Trocar por um parser XML de verdade se algum reporter passar a gerar CDATA com "</testcase>".
function lerJUnit(xml) {
  const casos = [];
  const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const [, attrs, , corpo = ""] of xml.matchAll(re)) {
    const tag = ` ${attrs}`;
    const falha = corpo.match(/<(failure|error)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/);
    casos.push({
      nome: atributo(tag, "name"),
      classe: atributo(tag, "classname"),
      tempo: Number(atributo(tag, "time")) || 0,
      status: falha ? "falhou" : /<skipped\b/.test(corpo) ? "ignorado" : "passou",
      mensagem: falha
        ? decodificar(atributo(` ${falha[2]}`, "message") || falha[3] || "")
            .replace(/<!\[CDATA\[|\]\]>/g, "")
            .replace(/\u001b\[[0-9;]*m/g, "")
            .trim()
            .slice(0, 1500)
        : "",
    });
  }
  return casos;
}

function lerSuite({ id, nome }) {
  const dir = join(dirResultados, id);
  const todos = arquivos(dir);
  const casos = todos.filter((f) => f.endsWith(".xml")).flatMap((f) => lerJUnit(readFileSync(f, "utf8")));
  const cobArq = todos.find((f) => f.endsWith("coverage-summary.json"));
  const cob = cobArq ? JSON.parse(readFileSync(cobArq, "utf8")).total : null;
  const conta = (s) => casos.filter((c) => c.status === s).length;
  const total = casos.length;
  const passou = conta("passou");
  const falhou = conta("falhou");
  const ignorado = conta("ignorado");
  const job = process.env[`RESULTADO_${id.toUpperCase()}`] ?? (total ? "success" : "skipped");
  return {
    id,
    nome,
    job,
    executada: total > 0,
    total,
    passou,
    falhou,
    ignorado,
    aprovacao: total - ignorado ? +((passou / (total - ignorado)) * 100).toFixed(1) : null,
    duracao: +casos.reduce((s, c) => s + c.tempo, 0).toFixed(1),
    cobertura: cob && {
      linhas: cob.lines.pct,
      branches: cob.branches.pct,
      funcoes: cob.functions.pct,
      statements: cob.statements.pct,
    },
    casos,
  };
}

// Catálogo de casos de teste (TCxx -> HU) e histórias (HU -> prioridade/escopo).
function lerCatalogo() {
  const md = (f) => readFileSync(join(RAIZ, "docs", "tests", f), "utf8");
  const tcs = [...md("casos-de-teste.md").matchAll(/^\| \[(TC\d+)\]\([^)]*\) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/gm)].map(
    ([, id, hu, titulo, nivel]) => ({ id, hu: hu.trim(), titulo: titulo.trim(), nivel: nivel.trim() }),
  );
  const hus = [...md("historias-de-usuario.md").matchAll(/^\| (HU-\d+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/gm)].map(
    ([, id, descricao, prioridade, escopo]) => ({
      id,
      descricao: descricao.trim(),
      prioridade: prioridade.trim(),
      noEscopo: escopo.trim().startsWith("Dentro"),
    }),
  );
  return { tcs, hus };
}

// ---------- métricas ----------
const suites = SUITES.map(lerSuite);
const { tcs, hus } = lerCatalogo();
const todosCasos = suites.flatMap((s) => s.casos.map((c) => ({ ...c, suite: s.nome })));

const statusTc = new Map(); // TCxx -> "passou" | "falhou"
for (const c of todosCasos) {
  for (const id of new Set(c.nome.match(/\bTC\d{2,3}\b/g) ?? [])) {
    if (c.status === "ignorado") continue;
    if (statusTc.get(id) !== "falhou") statusTc.set(id, c.status);
  }
}

const PESO = { Crítico: 4, Alto: 3, Médio: 2, Baixo: 1 };
const riscos = hus
  .filter((h) => h.noEscopo)
  .map((h) => {
    const casos = tcs.filter((t) => t.hu === h.id);
    const automatizados = casos.filter((t) => statusTc.has(t.id));
    const falhando = automatizados.filter((t) => statusTc.get(t.id) === "falhou");
    const essencial = h.prioridade === "Must have";
    const pct = casos.length ? (automatizados.length / casos.length) * 100 : 0;
    let risco = "Baixo";
    let motivo = "Casos automatizados passando.";
    if (falhando.length) {
      risco = essencial ? "Crítico" : "Alto";
      motivo = `${falhando.length} caso(s) automatizado(s) falhando: ${falhando.map((t) => t.id).join(", ")}.`;
    } else if (!casos.length) {
      risco = essencial ? "Alto" : "Médio";
      motivo = "Nenhum caso de teste especificado.";
    } else if (!automatizados.length) {
      risco = essencial ? "Alto" : "Médio";
      motivo = "Nenhum caso de teste automatizado.";
    } else if (pct < META.casosAutomatizados) {
      risco = "Médio";
      motivo = `Só ${automatizados.length} de ${casos.length} casos automatizados.`;
    }
    return { ...h, casos: casos.length, automatizados: automatizados.length, falhando: falhando.length, pct: +pct.toFixed(0), risco, motivo };
  })
  .sort((a, b) => PESO[b.risco] - PESO[a.risco] || a.id.localeCompare(b.id));

const executadas = suites.filter((s) => s.executada);
const soma = (k) => executadas.reduce((t, s) => t + s[k], 0);
const total = soma("total");
const ignorados = soma("ignorado");
const falhas = soma("falhou");
const jobsComErro = suites.filter((s) => ["failure", "cancelled"].includes(s.job));
const tcsAutomatizados = tcs.filter((t) => statusTc.has(t.id)).length;
const coberturaApi = suites.find((s) => s.id === "api")?.cobertura?.linhas ?? null;

const metricas = {
  geradoEm: new Date().toISOString(),
  execucao: {
    numero: process.env.GITHUB_RUN_NUMBER ?? "local",
    evento: process.env.GITHUB_EVENT_NAME ?? "local",
    branch: process.env.GITHUB_REF_NAME ?? "local",
    commit: (process.env.GITHUB_SHA ?? "local").slice(0, 7),
    url: process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
  },
  totais: {
    testes: total,
    passou: soma("passou"),
    falhou: falhas,
    ignorado: ignorados,
    aprovacao: total - ignorados ? +((soma("passou") / (total - ignorados)) * 100).toFixed(1) : null,
    duracao: +executadas.reduce((t, s) => t + s.duracao, 0).toFixed(1),
  },
  casosDeTeste: {
    especificados: tcs.length,
    automatizados: tcsAutomatizados,
    falhando: [...statusTc.values()].filter((s) => s === "falhou").length,
    pct: tcs.length ? +((tcsAutomatizados / tcs.length) * 100).toFixed(1) : 0,
  },
  coberturaLinhasApi: coberturaApi,
};
metricas.status =
  falhas || jobsComErro.length
    ? "Reprovado"
    : (coberturaApi ?? 0) < META.coberturaLinhas || !executadas.length
      ? "Atenção"
      : "Aprovado";

// Histórico para tendência (restaurado do cache pelo workflow).
mkdirSync(dirSaida, { recursive: true });
const arqHistorico = join(dirSaida, "historico.json");
const historico = existsSync(arqHistorico) ? JSON.parse(readFileSync(arqHistorico, "utf8")) : [];
historico.push({
  data: metricas.geradoEm,
  numero: metricas.execucao.numero,
  evento: metricas.execucao.evento,
  branch: metricas.execucao.branch,
  commit: metricas.execucao.commit,
  status: metricas.status,
  aprovacao: metricas.totais.aprovacao,
  testes: total,
  falhas,
  coberturaApi,
  casosPct: metricas.casosDeTeste.pct,
  duracao: metricas.totais.duracao,
});
const tendencia = historico.slice(-HISTORICO_MAX);

const falhasLista = todosCasos.filter((c) => c.status === "falhou");
const lentos = [...todosCasos].sort((a, b) => b.tempo - a.tempo).slice(0, 8);

writeFileSync(arqHistorico, JSON.stringify(tendencia, null, 2));
writeFileSync(
  join(dirSaida, "metricas.json"),
  JSON.stringify({ ...metricas, suites: suites.map(({ casos, ...s }) => s), riscos, falhas: falhasLista }, null, 2),
);

// ---------- HTML ----------
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pct = (v) => (v == null ? "—" : `${v}%`);
const seg = (v) => `${v.toFixed(1)} s`;
const cor = { Aprovado: "ok", Atenção: "warn", Reprovado: "bad", Crítico: "bad", Alto: "bad", Médio: "warn", Baixo: "ok" };
const statusJob = { success: "ok", failure: "bad", cancelled: "bad", skipped: "muted" };

const CSS = `
:root{--bg:#f7f7f5;--card:#fff;--fg:#1d1d1b;--muted:#6b6b66;--line:#e4e4df;--ok:#1f7a4d;--ok-bg:#e3f3ea;--warn:#8a5a00;--warn-bg:#fdf1d6;--bad:#b42318;--bad-bg:#fde8e6;--bar:#2f5d8a}
@media (prefers-color-scheme:dark){:root{--bg:#141413;--card:#1e1e1c;--fg:#ececea;--muted:#a2a29c;--line:#33332f;--ok:#5fd39a;--ok-bg:#16301f;--warn:#f0c060;--warn-bg:#352a10;--bad:#ff8a80;--bad-bg:#3a1714;--bar:#7fb0e0}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1080px;margin:0 auto;padding:32px 16px 64px}h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:36px 0 12px}
.sub{color:var(--muted);margin:0 0 24px}.sub a{color:inherit}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px}
.kpi .v{font-size:28px;font-weight:650;font-variant-numeric:tabular-nums}.kpi .l{color:var(--muted);font-size:13px}.kpi .m{color:var(--muted);font-size:12px;margin-top:4px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;font-size:14px}
th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}tr:last-child td{border-bottom:0}
.tag{display:inline-block;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600;white-space:nowrap}
.ok{color:var(--ok);background:var(--ok-bg)}.warn{color:var(--warn);background:var(--warn-bg)}.bad{color:var(--bad);background:var(--bad-bg)}.muted{color:var(--muted);background:var(--line)}
.bar{height:8px;background:var(--line);border-radius:99px;overflow:hidden;min-width:80px}.bar i{display:block;height:100%;background:var(--bar)}
pre{white-space:pre-wrap;word-break:break-word;font-size:12px;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:8px;margin:6px 0 0;max-height:220px;overflow:auto}
.trend{display:flex;align-items:flex-end;gap:4px;height:90px;padding-top:8px}.trend span{flex:1;min-width:6px;border-radius:3px 3px 0 0}
.trend .ok{background:var(--ok)}.trend .warn{background:var(--warn)}.trend .bad{background:var(--bad)}
.banner{display:flex;gap:16px;align-items:center;padding:20px;border-radius:10px;margin-bottom:20px}.banner b{font-size:22px}
.scroll{overflow-x:auto}p.note{color:var(--muted);font-size:13px}`;

const pagina = (titulo, corpo) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}</title><style>${CSS}</style></head>
<body><main>
<h1>${esc(titulo)}</h1>
<p class="sub">Execução #${esc(metricas.execucao.numero)} · ${esc(metricas.execucao.evento)} · branch <b>${esc(metricas.execucao.branch)}</b> · commit ${esc(metricas.execucao.commit)} · ${new Date(metricas.geradoEm).toLocaleString("pt-BR", { timeZone: "America/Recife" })}${metricas.execucao.url ? ` · <a href="${esc(metricas.execucao.url)}">ver no GitHub Actions</a>` : ""}</p>
${corpo}
</main></body></html>`;

const kpi = (valor, rotulo, meta = "", classe = "") =>
  `<div class="card kpi"><div class="v ${classe ? `tag ${classe}` : ""}" ${classe ? 'style="font-size:20px"' : ""}>${valor}</div><div class="l">${rotulo}</div>${meta ? `<div class="m">${meta}</div>` : ""}</div>`;
const barra = (v) => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, v ?? 0))}%"></i></div>`;
const grafTendencia = (campo, max = 100) =>
  `<div class="card"><div class="trend">${tendencia
    .map(
      (h) =>
        `<span class="${cor[h.status]}" style="height:${Math.max(4, ((h[campo] ?? 0) / max) * 100)}%" title="#${esc(h.numero)} (${esc(h.branch)}) — ${esc(h.status)} — ${pct(h[campo])}"></span>`,
    )
    .join("")}</div><p class="note">Últimas ${tendencia.length} execuções (mais recente à direita). Cor = status da execução.</p></div>`;

const tabelaSuites = `<div class="scroll"><table><thead><tr><th>Suíte</th><th>Job</th><th class="n">Testes</th><th class="n">Passou</th><th class="n">Falhou</th><th class="n">Ignor.</th><th class="n">Aprovação</th><th class="n">Tempo</th><th class="n">Cob. linhas</th><th class="n">Cob. branches</th></tr></thead><tbody>
${suites
  .map(
    (s) =>
      `<tr><td>${esc(s.nome)}</td><td><span class="tag ${statusJob[s.job] ?? "muted"}">${esc(s.executada ? s.job : s.job === "skipped" ? "não executada" : s.job)}</span></td><td class="n">${s.total}</td><td class="n">${s.passou}</td><td class="n">${s.falhou}</td><td class="n">${s.ignorado}</td><td class="n">${pct(s.aprovacao)}</td><td class="n">${seg(s.duracao)}</td><td class="n">${pct(s.cobertura?.linhas)}</td><td class="n">${pct(s.cobertura?.branches)}</td></tr>`,
  )
  .join("")}
</tbody></table></div>`;

const tecnico = pagina(
  "Urbanize — Relatório técnico de qualidade",
  `<div class="grid">
${kpi(esc(metricas.status), "Status do Quality Gate", "", cor[metricas.status])}
${kpi(pct(metricas.totais.aprovacao), "Taxa de aprovação", `meta ${META.aprovacao}%`)}
${kpi(`${metricas.totais.falhou}`, "Testes falhando", `${metricas.totais.testes} executados · ${metricas.totais.ignorado} ignorados`)}
${kpi(pct(coberturaApi), "Cobertura de linhas (API)", `meta ${META.coberturaLinhas}%`)}
${kpi(pct(suites[0].cobertura?.linhas), "Cobertura de linhas (mobile)", "só arquivos exercitados pelos testes")}
${kpi(`${metricas.casosDeTeste.automatizados}/${metricas.casosDeTeste.especificados}`, "Casos de teste automatizados", `${pct(metricas.casosDeTeste.pct)} · meta ${META.casosAutomatizados}%`)}
${kpi(seg(metricas.totais.duracao), "Tempo somado dos testes")}
</div>
<h2>Resultados por suíte</h2>${tabelaSuites}
${jobsComErro.filter((s) => !s.falhou).length ? `<p class="note">⚠ Job(s) com erro sem teste falhando (falha de infraestrutura, build ou banco): ${jobsComErro.filter((s) => !s.falhou).map((s) => esc(s.nome)).join(", ")}. Ver logs nos artefatos.</p>` : ""}
<h2>Falhas identificadas (${falhasLista.length})</h2>
${
  falhasLista.length
    ? `<div class="scroll"><table><thead><tr><th>Suíte</th><th>Teste</th></tr></thead><tbody>${falhasLista
        .map((c) => `<tr><td>${esc(c.suite)}</td><td><b>${esc(c.nome)}</b><br><span class="note">${esc(c.classe)}</span><pre>${esc(c.mensagem)}</pre></td></tr>`)
        .join("")}</tbody></table></div>`
    : `<p class="note">Nenhuma falha nesta execução.</p>`
}
<h2>Tendência da taxa de aprovação</h2>${grafTendencia("aprovacao")}
<h2>Tendência da cobertura de linhas (API)</h2>${grafTendencia("coberturaApi")}
<h2>Cobertura de código detalhada</h2>
<div class="scroll"><table><thead><tr><th>Suíte</th><th class="n">Linhas</th><th class="n">Statements</th><th class="n">Funções</th><th class="n">Branches</th></tr></thead><tbody>
${suites
  .filter((s) => s.cobertura)
  .map((s) => `<tr><td>${esc(s.nome)}</td><td class="n">${pct(s.cobertura.linhas)}</td><td class="n">${pct(s.cobertura.statements)}</td><td class="n">${pct(s.cobertura.funcoes)}</td><td class="n">${pct(s.cobertura.branches)}</td></tr>`)
  .join("") || `<tr><td colspan="5">Sem dados de cobertura.</td></tr>`}
</tbody></table></div>
<h2>Testes mais lentos</h2>
<div class="scroll"><table><thead><tr><th>Teste</th><th>Suíte</th><th class="n">Tempo</th></tr></thead><tbody>
${lentos.map((c) => `<tr><td>${esc(c.nome)}</td><td>${esc(c.suite)}</td><td class="n">${seg(c.tempo)}</td></tr>`).join("")}
</tbody></table></div>
<h2>Rastreabilidade por história de usuário</h2>
<div class="scroll"><table><thead><tr><th>HU</th><th>Prioridade</th><th class="n">Casos</th><th class="n">Automatizados</th><th class="n">Falhando</th><th>Progresso</th></tr></thead><tbody>
${riscos.map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.prioridade)}</td><td class="n">${r.casos}</td><td class="n">${r.automatizados}</td><td class="n">${r.falhando}</td><td>${barra(r.pct)}</td></tr>`).join("")}
</tbody></table></div>
<p class="note">Casos de teste vêm de docs/tests/casos-de-teste.md; um caso conta como automatizado quando o ID (ex.: TC02) aparece no nome de um teste executado. Artefatos brutos (JUnit XML, logs, cobertura, relatório Playwright) estão anexados à execução.</p>`,
);

const negocio = pagina(
  "Urbanize — Relatório de qualidade do produto",
  `<div class="banner ${cor[metricas.status]}"><b>${esc(metricas.status)}</b><span>${
    metricas.status === "Aprovado"
      ? "Todas as verificações automáticas passaram. A versão está apta a seguir para homologação."
      : metricas.status === "Atenção"
        ? "Nenhuma falha encontrada, mas algum indicador está abaixo da meta. Liberar com ressalvas."
        : `Foram encontradas ${falhas} falha(s) nas verificações automáticas. Não recomendamos liberar esta versão até a correção.`
  }</span></div>
<div class="grid">
${kpi(pct(metricas.totais.aprovacao), "Verificações aprovadas", `${metricas.totais.passou} de ${metricas.totais.testes - metricas.totais.ignorado}`)}
${kpi(`${riscos.filter((r) => r.risco === "Crítico" || r.risco === "Alto").length}`, "Funcionalidades em risco alto ou crítico", `de ${riscos.length} no escopo`)}
${kpi(pct(metricas.casosDeTeste.pct), "Cenários de teste automatizados", `${metricas.casosDeTeste.automatizados} de ${metricas.casosDeTeste.especificados} · meta ${META.casosAutomatizados}%`)}
${kpi(pct(coberturaApi), "Código do servidor verificado", `meta ${META.coberturaLinhas}%`)}
</div>
<h2>Riscos por funcionalidade</h2>
<div class="scroll"><table><thead><tr><th>Risco</th><th>Funcionalidade</th><th>Prioridade</th><th>Situação</th></tr></thead><tbody>
${riscos.map((r) => `<tr><td><span class="tag ${cor[r.risco]}">${esc(r.risco)}</span></td><td><b>${esc(r.id)}</b> — ${esc(r.descricao)}</td><td>${esc(r.prioridade)}</td><td>${esc(r.motivo)}</td></tr>`).join("")}
</tbody></table></div>
<p class="note">Crítico: funcionalidade essencial (Must have) com verificação falhando. Alto: falha em funcionalidade não essencial, ou funcionalidade essencial sem nenhuma verificação automática. Médio: verificação automática parcial (abaixo de ${META.casosAutomatizados}% dos cenários). Baixo: cenários automatizados e passando.</p>
<h2>Evolução da qualidade</h2>${grafTendencia("aprovacao")}
<h2>Recomendações</h2><ul>
${[
  falhas && `Corrigir as ${falhas} verificação(ões) com falha antes de liberar a versão (detalhes no relatório técnico e na issue aberta automaticamente).`,
  jobsComErro.some((s) => !s.falhou) && "Uma etapa da pipeline falhou antes de rodar os testes; a equipe técnica deve verificar o ambiente.",
  riscos.some((r) => r.risco === "Alto" && !r.falhando) &&
    `Priorizar automação das funcionalidades essenciais sem cobertura: ${riscos.filter((r) => r.risco === "Alto" && !r.falhando).map((r) => r.id).join(", ")}.`,
  metricas.casosDeTeste.pct < META.casosAutomatizados &&
    `Ampliar a automação: faltam ${Math.ceil((META.casosAutomatizados / 100) * tcs.length) - tcsAutomatizados} cenários para atingir a meta de ${META.casosAutomatizados}%.`,
  (coberturaApi ?? 0) < META.coberturaLinhas && "Aumentar a cobertura de código do servidor até a meta.",
]
  .filter(Boolean)
  .map((r) => `<li>${esc(r)}</li>`)
  .join("") || "<li>Manter o ritmo atual; nenhum ponto de atenção.</li>"}
</ul>`,
);

writeFileSync(join(dirSaida, "relatorio-tecnico.html"), tecnico);
writeFileSync(join(dirSaida, "relatorio-negocio.html"), negocio);

// ---------- Markdown (Job Summary e issue) ----------
const linhaSuite = (s) =>
  `| ${s.nome} | ${s.executada ? s.job : "não executada"} | ${s.total} | ${s.falhou} | ${pct(s.aprovacao)} | ${pct(s.cobertura?.linhas)} |`;
const resumo = `## Qualidade — ${metricas.status}

| Indicador | Valor | Meta |
| --- | --- | --- |
| Taxa de aprovação | ${pct(metricas.totais.aprovacao)} | ${META.aprovacao}% |
| Testes falhando | ${falhas} | 0 |
| Cobertura de linhas (API) | ${pct(coberturaApi)} | ${META.coberturaLinhas}% |
| Casos de teste automatizados | ${metricas.casosDeTeste.automatizados}/${metricas.casosDeTeste.especificados} (${pct(metricas.casosDeTeste.pct)}) | ${META.casosAutomatizados}% |
| HUs em risco alto/crítico | ${riscos.filter((r) => PESO[r.risco] >= 3).length}/${riscos.length} | 0 |

| Suíte | Job | Testes | Falhas | Aprovação | Cob. linhas |
| --- | --- | --- | --- | --- | --- |
${suites.map(linhaSuite).join("\n")}

Relatórios técnico e de negócio (HTML) no artefato **relatorios-qualidade**.
`;
writeFileSync(join(dirSaida, "resumo.md"), resumo);

const issue = `A execução [#${metricas.execucao.numero}](${metricas.execucao.url ?? "#"}) do workflow **Regressão** falhou (evento \`${metricas.execucao.evento}\`, branch \`${metricas.execucao.branch}\`, commit ${metricas.execucao.commit}).

${suites.map((s) => `- **${s.nome}:** ${s.executada ? `${s.falhou} falha(s) de ${s.total}` : "sem resultados"} — job \`${s.job}\``).join("\n")}

### Testes com falha
${
  falhasLista.length
    ? falhasLista
        .slice(0, 20)
        .map((c) => `<details><summary><b>${esc(c.suite)}</b> — ${esc(c.nome)}</summary>\n\n\`\`\`\n${c.mensagem.slice(0, 800)}\n\`\`\`\n</details>`)
        .join("\n") + (falhasLista.length > 20 ? `\n\n…e mais ${falhasLista.length - 20}.` : "")
    : "Nenhum teste reportou falha: o erro ocorreu fora dos testes (instalação, build, banco ou servidor). Ver os logs nos artefatos `resultados-*`."
}

Artefatos: JUnit XML, logs, cobertura e relatórios técnico/negócio estão anexados à execução.
_Issue aberta automaticamente pela pipeline; será fechada sozinha quando a regressão voltar a passar._
`;
writeFileSync(join(dirSaida, "issue.md"), issue);

console.log(`Status: ${metricas.status} · ${total} testes · ${falhas} falhas · aprovação ${pct(metricas.totais.aprovacao)} · cobertura API ${pct(coberturaApi)} · TCs ${tcsAutomatizados}/${tcs.length}`);
