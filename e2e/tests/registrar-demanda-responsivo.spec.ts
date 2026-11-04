import { expect, Page, test } from "@playwright/test";

/**
 * TC92, TC93 e TC94 - Registro de demanda sem rolagem horizontal em mobile, tablet e desktop.
 *
 * Repete o fluxo de registrar-demanda.spec.ts (TC41) em cada viewport e, em cada tela
 * (login, dashboard, nova demanda e detalhe), confere que
 * document.documentElement.scrollWidth não passa da largura do viewport.
 */
const viewports = [
  { caso: "TC92", nome: "mobile", width: 375, height: 812 },
  { caso: "TC93", nome: "tablet", width: 768, height: 1024 },
  { caso: "TC94", nome: "desktop", width: 1440, height: 900 },
];

async function semRolagemHorizontal(page: Page, largura: number) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(largura);
}

for (const { caso, nome, width, height } of viewports) {
  test(`${caso}: registra demanda em viewport ${nome} (${width}x${height}) sem rolagem horizontal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const titulo = `Buraco na via - teste e2e viewport ${nome} ${Date.now()}`;

    await page.goto("/login");
    await expect(page.getByTestId("btn-entrar")).toBeVisible();
    await semRolagemHorizontal(page, width);

    await page.getByTestId("input-email").fill("cidadao@urbanize.com");
    await page.getByTestId("input-senha").fill("demo");
    await page.getByTestId("btn-entrar").click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await semRolagemHorizontal(page, width);

    await page.goto("/demandas/nova");
    await expect(page.getByTestId("input-titulo")).toBeVisible();
    await page.getByTestId("input-titulo").fill(titulo);
    await page.getByTestId("input-descricao").fill("Descrição gerada pelo teste E2E de responsividade.");
    await page.getByTestId("input-endereco").fill("Rua de Teste, 123");
    await page.getByTestId("checkbox-aceite").click();
    await semRolagemHorizontal(page, width);

    await page.getByTestId("btn-registrar").click();
    await expect(page).toHaveURL(/\/demandas\/[^/]+$/, { timeout: 10_000 });
    await expect(page.getByText(/^URB-/)).toBeVisible();
    await expect(page.getByText(titulo).first()).toBeVisible();
    await semRolagemHorizontal(page, width);
  });
}
