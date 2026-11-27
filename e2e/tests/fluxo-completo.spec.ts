import path from "node:path";
import { Browser, BrowserContext, BrowserContextOptions, Page, expect, test } from "@playwright/test";

/**
 * Fluxo ponta a ponta da entrega final, pela UI web:
 *
 *   cadastro → registro de demanda com foto e GPS → acompanhamento e filtros
 *   → atualização de status pelo gestor → notificação ao cidadão
 *
 * Cada etapa roda num contexto de navegador próprio. O cidadão leva a sessão e o cache
 * local (localStorage) de uma etapa para a outra via storageState, como o mesmo aparelho
 * reaberto; é esse cache que permite ao app perceber que o status mudou e avisar.
 *
 * Com DEMO_VIDEO_DIR definido, cada etapa grava um vídeo (usado para gerar os GIFs do
 * README, ver e2e/README.md) e as pausas ficam mais longas para dar para acompanhar.
 */
const BASE_URL = process.env.WEB_URL ?? "http://localhost:8081";
const VIDEO_DIR = process.env.DEMO_VIDEO_DIR;
const FOTO = path.join(__dirname, "..", "fixtures", "lixo-acumulado.jpg");
const RECIFE = { latitude: -8.0631, longitude: -34.8711 };
const MOBILE = { width: 390, height: 844 };

const pause = (page: Page, ms = 700) => (VIDEO_DIR ? page.waitForTimeout(ms) : Promise.resolve());

async function openStage(
  browser: Browser,
  name: string,
  options: BrowserContextOptions = {}
): Promise<{ context: BrowserContext; page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: MOBILE,
    deviceScaleFactor: 2,
    ...(VIDEO_DIR ? { recordVideo: { dir: VIDEO_DIR, size: MOBILE } } : {}),
    ...options,
  });
  const page = await context.newPage();
  return {
    context,
    page,
    close: async () => {
      await pause(page, 1200);
      const video = page.video();
      await context.close();
      if (video) await video.saveAs(path.join(VIDEO_DIR!, `${name}.webm`));
    },
  };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill("demo");
  await pause(page, 400);
  await page.getByTestId("btn-entrar").click();
}

test("fluxo completo: cadastro → demanda com foto e GPS → filtros → gestor → notificação @smoke", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const sufixo = Date.now();
  const email = `fluxo-${sufixo}@urbanize.test`;
  const titulo = `Lixo acumulado na calçada ${sufixo}`;

  // 1. Cadastro do cidadão
  const cadastro = await openStage(browser, "1-cadastro");
  await cadastro.page.goto("/");
  await pause(cadastro.page, 1500);
  await cadastro.page.getByText("Criar conta", { exact: true }).click();
  await cadastro.page.getByTestId("input-nome").fill("Ana Moradora");
  await cadastro.page.getByTestId("input-email").fill(email);
  await cadastro.page.getByTestId("input-telefone").fill("(81) 98888-7777");
  await cadastro.page.getByTestId("input-senha").fill("senhaSegura123");
  await pause(cadastro.page);
  await cadastro.page.getByTestId("btn-criar-conta").click();
  await expect(cadastro.page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(cadastro.page.getByText("Ana", { exact: true })).toBeVisible();
  let estadoCidadao = await cadastro.context.storageState();
  await cadastro.close();

  // 2. Registro da demanda com foto (galeria) e GPS do aparelho
  const registro = await openStage(browser, "2-registro", {
    storageState: estadoCidadao,
    geolocation: RECIFE,
    permissions: ["geolocation"],
  });
  const { page } = registro;
  await page.goto("/dashboard");
  await pause(page);
  await page.getByTestId("cta-nova-demanda").click();
  await expect(page).toHaveURL(/\/demandas\/nova$/);

  // O aceite libera os botões de foto: a imagem é enviada para a triagem assim que é escolhida.
  await page.getByTestId("checkbox-aceite").click();
  const seletorArquivo = page.waitForEvent("filechooser");
  await page.getByTestId("btn-galeria").click();
  await (await seletorArquivo).setFiles(FOTO);
  await expect(page.getByTestId("triagem-sugerida")).toBeVisible({ timeout: 15_000 });
  await pause(page);

  await page.getByTestId("input-titulo").fill(titulo);
  await page.getByTestId("input-descricao").fill("Sacos de lixo e caixas acumulados na calçada há três dias.");
  await page.getByTestId("select-categoria-coleta_de_lixo").click();
  await page.getByTestId("select-prioridade-alta").click();
  await pause(page);

  await page.getByTestId("btn-localizacao").click();
  await expect(page.getByText(/GPS: -8\.06/)).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("input-endereco").fill("Rua da Aurora, 120");
  await page.getByLabel("Bairro").fill("Boa Vista");
  await pause(page);
  await page.getByTestId("btn-registrar").click();

  await expect(page).toHaveURL(/\/demandas\/[^/]+$/, { timeout: 15_000 });
  const protocolo = (await page.getByText(/^URB-\d+$/).textContent())!.trim();
  await expect(page.getByTestId("status-atual")).toHaveText("Em análise");
  await expect(page.getByTestId("foto-demanda")).toBeVisible();
  await pause(page, 1500);
  estadoCidadao = await registro.context.storageState();
  await registro.close();

  // 3. Acompanhamento: listagem com filtros por categoria e status
  const acompanhamento = await openStage(browser, "3-filtros", { storageState: estadoCidadao });
  const lista = acompanhamento.page;
  await lista.goto("/demandas");
  await expect(lista.getByTestId(`card-demanda-${protocolo}`)).toBeVisible();
  await lista.getByTestId("btn-filtros").click();
  await pause(lista);
  await lista.getByTestId("filtro-categoria-coleta_de_lixo").click();
  await lista.getByTestId("filtro-status-em_analise").click();
  await pause(lista);
  await lista.getByTestId("btn-aplicar-filtros").click();
  await expect(lista.getByTestId(`card-demanda-${protocolo}`)).toBeVisible();
  await expect(lista.locator('[data-testid^="card-demanda-"]')).toHaveCount(1);
  await pause(lista, 1200);
  estadoCidadao = await acompanhamento.context.storageState();
  await acompanhamento.close();

  // 4. Gestor encontra a demanda e muda o status
  const gestor = await openStage(browser, "4-gestor");
  const painel = gestor.page;
  await login(painel, "gestor@urbanize.com");
  await expect(painel).toHaveURL(/\/gestor$/, { timeout: 15_000 });
  await expect(painel.getByTestId("grafico-categorias")).toBeVisible();
  await pause(painel, 1500);
  await painel.getByTestId("tab-/demandas").click();
  await painel.getByTestId("input-busca").fill(protocolo);
  await painel.getByTestId("btn-aplicar-filtros").click();
  await painel.getByTestId(`card-demanda-${protocolo}`).click();
  await expect(painel.getByTestId("status-atual")).toHaveText("Em análise");
  await painel.getByTestId("input-observacao").fill("Equipe de limpeza urbana a caminho.");
  await pause(painel);
  await painel.getByTestId("btn-status-em_atendimento").click();
  await expect(painel.getByTestId("status-atual")).toHaveText("Em atendimento");
  await expect(painel.getByTestId("feedback-status")).toBeVisible();
  await expect(painel.getByText("Equipe de limpeza urbana a caminho.")).toBeVisible();
  await gestor.close();

  // 5. Cidadão volta ao app e é notificado da mudança
  const notificacao = await openStage(browser, "5-notificacao", { storageState: estadoCidadao });
  const app = notificacao.page;
  await app.goto("/dashboard");
  const aviso = app.getByTestId("aviso-notificacao");
  await expect(aviso).toBeVisible({ timeout: 15_000 });
  await expect(aviso).toContainText(`Demanda ${protocolo}: Em atendimento`);
  await pause(app, 2000);
  await aviso.click();
  await expect(app).toHaveURL(/\/demandas\/[^/]+$/);
  await expect(app.getByTestId("status-atual")).toHaveText("Em atendimento");
  await expect(app.getByText("Equipe de limpeza urbana a caminho.")).toBeVisible();
  await notificacao.close();
});
