import { expect, test } from "@playwright/test";

/**
 * Cenário: Cidadão pesquisa e filtra demandas na listagem principal.
 *
 * Fluxo completo, pela perspectiva do usuário, na versão web do app (Expo Router
 * + react-native-web):
 *   1. Login com credenciais de cidadão (login.tsx).
 *   2. Navegação até "Demandas" pela tab bar (_layout.tsx).
 *   3. Preenchimento do campo de busca com o termo desejado (demandas/index.tsx).
 *   4. Confirmação de que o resultado correspondente é exibido na listagem.
 */
test("cidadão consegue buscar e filtrar demandas na listagem", async ({ page }) => {
  const termoBusca = "Buraco";

  await page.goto("/login");

  await page.getByTestId("input-email").fill("cidadao@urbanize.com");
  await page.getByTestId("input-senha").fill("demo");
  await page.getByTestId("btn-entrar").click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("tab-/demandas").click();
  await expect(page).toHaveURL(/\/demandas$/);

  await page.getByTestId("input-busca").fill(termoBusca);

  await expect(page.getByText(termoBusca).first()).toBeVisible();
});
