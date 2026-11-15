import { expect, test, type Page } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000/api";

const entrar = async (page: Page, email: string, senha: string, destino: RegExp) => {
  await page.goto("/login");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill(senha);
  await page.getByTestId("btn-entrar").click();
  await expect(page).toHaveURL(destino);
};

/**
 * TC78 - Cidadão é avisado quando o gestor muda o status da demanda dele.
 *
 * Pré-condição (via API): um cidadão novo, sem avisos, com uma demanda registrada.
 *
 *   1. Cidadão entra no app (sessão A): a aba "Avisos" não mostra contador.
 *   2. Gestor entra em outra sessão (B), abre a demanda e muda o status para "Encaminhada"
 *      com uma observação.
 *   3. Na sessão A, ao navegar, a aba "Avisos" passa a mostrar 1 aviso não lido.
 *   4. A tela "Avisos" exibe a mensagem com o protocolo, o novo status e a observação do gestor;
 *      depois de aberta, o contador some.
 *   5. Tocar no aviso leva ao detalhe da demanda, já com o status "Encaminhada".
 */
test("TC78: gestor muda o status e o cidadão vê o aviso correspondente", async ({ browser, request }) => {
  const sufixo = Date.now();
  const email = `aviso78-${sufixo}@urbanize.test`;
  const senha = "demo1234";
  const observacao = "Encaminhada à Emlurb para recolhimento.";

  const registro = await request.post(`${API_URL}/auth/register`, {
    data: { nome: "Cidadão Aviso", email, senha },
  });
  expect(registro.status()).toBe(201);
  const tokenCidadao = (await registro.json()).data.token;

  const criacao = await request.post(`${API_URL}/demands`, {
    headers: { Authorization: `Bearer ${tokenCidadao}` },
    data: {
      titulo: `Aviso status - teste e2e ${sufixo}`,
      descricao: "Entulho na calçada, registrado pelo teste E2E de notificação.",
      categoria: "coleta_de_lixo",
      endereco: { endereco: "Rua de Teste, 78", bairro: "Graças", cidade: "Recife" },
    },
  });
  expect(criacao.status()).toBe(201);
  const { id, protocolo } = (await criacao.json()).data;

  const cidadao = await (await browser.newContext()).newPage();
  await entrar(cidadao, email, senha, /\/dashboard$/);
  await expect(cidadao.getByTestId("tab-/avisos")).toBeVisible();
  await expect(cidadao.getByTestId("badge-avisos")).toHaveCount(0);

  const gestor = await (await browser.newContext()).newPage();
  await entrar(gestor, "gestor@urbanize.com", "demo", /\/gestor$/);
  await gestor.goto(`/demandas/${id}`);
  await expect(gestor.getByText(protocolo)).toBeVisible();
  await gestor.getByTestId("input-observacao").fill(observacao);
  await gestor.getByTestId("btn-status-encaminhada").click();
  await expect(gestor.getByTestId("status-atual")).toHaveText("Encaminhada");

  await cidadao.getByTestId("tab-/demandas").click();
  await expect(cidadao.getByTestId("badge-avisos")).toHaveText("1");

  await cidadao.getByTestId("tab-/avisos").click();
  await expect(cidadao).toHaveURL(/\/avisos$/);
  const aviso = cidadao.locator('[data-testid^="aviso-"]');
  await expect(aviso).toHaveCount(1);
  await expect(aviso).toContainText(`Sua demanda ${protocolo} mudou para "Encaminhada". ${observacao}`);

  await cidadao.getByTestId("tab-/dashboard").click();
  await expect(cidadao).toHaveURL(/\/dashboard$/);
  await expect(cidadao.getByTestId("badge-avisos")).toHaveCount(0);

  await cidadao.getByTestId("tab-/avisos").click();
  await aviso.click();
  await expect(cidadao).toHaveURL(new RegExp(`/demandas/${id}$`));
  await expect(cidadao.getByTestId("status-atual")).toHaveText("Encaminhada");
});
