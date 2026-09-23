import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000/api";

/**
 * Cenário: Gestor faz a triagem de uma demanda e conduz seu atendimento até "Resolvida".
 *
 * Fluxo completo, pela perspectiva do gestor, na versão web do app (Expo Router
 * + react-native-web):
 *   0. Pré-condição: um cidadão registra uma demanda pela API (o registro pela UI
 *      já é coberto por registrar-demanda.spec.ts).
 *   1. Login com credenciais de gestor e redirecionamento ao painel (login.tsx → gestor.tsx).
 *   2. A nova demanda aparece na "Triagem Inteligente" do painel (gestor.tsx).
 *   3. Navegação até "Demandas", busca pelo protocolo e abertura do detalhe (demandas/index.tsx).
 *   4. Avanço do status Em análise → Encaminhada → Em atendimento → Resolvida, com
 *      observação em cada etapa, conferindo status atual e histórico (demandas/[id].tsx).
 *   5. A listagem do gestor reflete o status "Resolvida".
 *   6. O cidadão que registrou a demanda vê o status "Resolvida" em "Minhas demandas".
 */
test("gestor conduz uma demanda da triagem até Resolvida", async ({ page, request }) => {
  const titulo = `Poste apagado - teste e2e gestor ${Date.now()}`;

  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: "cidadao@urbanize.com", senha: "demo" },
  });
  expect(login.ok()).toBeTruthy();
  const { token } = (await login.json()).data;

  const criacao = await request.post(`${API_URL}/demands`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      titulo,
      descricao: "Poste apagado há vários dias, registrado pelo teste E2E do gestor.",
      categoria: "iluminacao_publica",
      endereco: { endereco: "Rua de Teste, 456", bairro: "Boa Viagem", cidade: "Recife" },
    },
  });
  expect(criacao.status()).toBe(201);
  const { protocolo } = (await criacao.json()).data;

  await page.goto("/login");

  await page.getByTestId("input-email").fill("gestor@urbanize.com");
  await page.getByTestId("input-senha").fill("demo");
  await page.getByTestId("btn-entrar").click();

  await expect(page).toHaveURL(/\/gestor$/);
  await expect(page.getByText("Painel do gestor")).toBeVisible();
  await expect(page.getByText("Triagem Inteligente")).toBeVisible();
  await expect(page.getByText(titulo).first()).toBeVisible();

  await page.getByTestId("tab-/demandas").click();
  await expect(page).toHaveURL(/\/demandas$/);
  await expect(page.getByText("Todas as Demandas")).toBeVisible();

  await page.getByTestId("input-busca").fill(protocolo);
  await page.getByTestId("btn-aplicar-filtros").click();

  const cards = page.locator('[data-testid^="card-demanda-"]');
  await expect(cards).toHaveCount(1);
  await page.getByTestId(`card-demanda-${protocolo}`).click();

  await expect(page).toHaveURL(/\/demandas\/[^/]+$/);
  await expect(page.getByText(protocolo)).toBeVisible();
  await expect(page.getByTestId("status-atual")).toHaveText("Em análise");

  const etapas = [
    { status: "encaminhada", label: "Encaminhada", observacao: "Encaminhada à Neoenergia para vistoria." },
    { status: "em_atendimento", label: "Em atendimento", observacao: "Equipe técnica a caminho do local." },
    { status: "resolvida", label: "Resolvida", observacao: "Lâmpada substituída, poste funcionando." },
  ];

  for (const etapa of etapas) {
    await page.getByTestId("input-observacao").fill(etapa.observacao);
    await page.getByTestId(`btn-status-${etapa.status}`).click();

    await expect(page.getByTestId("status-atual")).toHaveText(etapa.label);
    await expect(page.getByText(etapa.observacao)).toBeVisible();
    // react-native-web renderiza o Pressable como <div>, então o "disabled" vem via aria-disabled.
    await expect(page.getByTestId(`btn-status-${etapa.status}`)).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("input-observacao")).toHaveValue("");
  }

  await page.getByTestId("tab-/demandas").click();
  await expect(page).toHaveURL(/\/demandas$/);
  await expect(page.getByTestId(`card-demanda-${protocolo}`)).toContainText("Resolvida");

  await page.getByText("Sair", { exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByTestId("input-email").fill("cidadao@urbanize.com");
  await page.getByTestId("input-senha").fill("demo");
  await page.getByTestId("btn-entrar").click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("tab-/demandas").click();
  await expect(page).toHaveURL(/\/demandas$/);
  await expect(page.getByTestId(`card-demanda-${protocolo}`)).toContainText("Resolvida");
});
