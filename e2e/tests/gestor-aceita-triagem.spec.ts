import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000/api";

/**
 * Cenário: Gestor aceita a sugestão de encaminhamento da Triagem Inteligente.
 *
 * Fluxo completo, pela perspectiva do gestor, na versão web do app (Expo Router
 * + react-native-web):
 *   0. Pré-condição: um cidadão registra uma demanda pela API; o backend classifica a
 *      demanda e sugere o órgão responsável (triagem automática).
 *   1. Login com credenciais de gestor e redirecionamento ao painel (login.tsx → gestor.tsx).
 *   2. Leitura das métricas "Em análise" e "Encaminhadas" antes da ação (gestor.tsx).
 *   3. A demanda aparece na "Triagem Inteligente" com o órgão sugerido e a confiança (gestor.tsx).
 *   4. O gestor aceita a sugestão: a demanda sai da fila e as métricas são atualizadas (gestor.tsx).
 *   5. Na "Fila recente", a demanda aparece como "Encaminhada"; no detalhe, o histórico
 *      registra o encaminhamento para o órgão sugerido (demandas/[id].tsx).
 */
test("gestor aceita a sugestão da Triagem Inteligente e a demanda é encaminhada", async ({
  page,
  request,
}) => {
  const titulo = `Lâmpada queimada - teste e2e triagem ${Date.now()}`;

  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: "cidadao@urbanize.com", senha: "demo" },
  });
  expect(login.ok()).toBeTruthy();
  const { token } = (await login.json()).data;

  const criacao = await request.post(`${API_URL}/demands`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      titulo,
      descricao: "Lâmpada do poste queimada, rua completamente escura à noite.",
      categoria: "iluminacao_publica",
      endereco: { endereco: "Rua de Teste, 789", bairro: "Boa Viagem", cidade: "Recife" },
    },
  });
  expect(criacao.status()).toBe(201);
  const { protocolo, sugestaoEncaminhamento, scoreTriagem } = (await criacao.json()).data;
  const confianca = Math.round(scoreTriagem * 100);

  await page.goto("/login");

  await page.getByTestId("input-email").fill("gestor@urbanize.com");
  await page.getByTestId("input-senha").fill("demo");
  await page.getByTestId("btn-entrar").click();

  await expect(page).toHaveURL(/\/gestor$/);
  await expect(page.getByText("Painel do gestor")).toBeVisible();

  const metricaEmAnalise = page.getByTestId("metrica-em-analise");
  const metricaEncaminhadas = page.getByTestId("metrica-encaminhadas");
  await expect(metricaEncaminhadas).toBeVisible();
  const emAnaliseAntes = Number(await metricaEmAnalise.textContent());
  const encaminhadasAntes = Number(await metricaEncaminhadas.textContent());

  const cardTriagem = page.getByTestId(`triagem-${protocolo}`);
  await expect(cardTriagem).toBeVisible();
  await expect(cardTriagem).toContainText(titulo);
  await expect(cardTriagem).toContainText(`Sugestão: ${sugestaoEncaminhamento} (${confianca}% confiança)`);

  await page.getByTestId(`btn-aceitar-${protocolo}`).click();

  await expect(cardTriagem).toHaveCount(0);
  await expect(metricaEncaminhadas).toHaveText(String(encaminhadasAntes + 1));
  await expect(metricaEmAnalise).toHaveText(String(emAnaliseAntes - 1));

  const cardFilaRecente = page.getByTestId(`card-demanda-${protocolo}`);
  await expect(cardFilaRecente).toContainText("Encaminhada");
  await cardFilaRecente.click();

  await expect(page).toHaveURL(/\/demandas\/[^/]+$/);
  await expect(page.getByText(protocolo)).toBeVisible();
  await expect(page.getByTestId("status-atual")).toHaveText("Encaminhada");
  await expect(page.getByText(`Triagem automática: ${sugestaoEncaminhamento}`)).toBeVisible();
  await expect(page.getByText(sugestaoEncaminhamento, { exact: true })).toBeVisible();
});
