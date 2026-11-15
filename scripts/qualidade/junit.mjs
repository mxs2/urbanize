// Leitura de JUnit XML compartilhada por relatorios.mjs e scripts/manutencao/verificar.mjs.

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
export function lerJUnit(xml) {
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
