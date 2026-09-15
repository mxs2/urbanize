import { expect, test } from "@playwright/test";

/**
 * Cenário: Cidadão registra uma nova demanda urbana.
 *
 * Fluxo completo, pela perspectiva do usuário, na versão web do app (Expo Router
 * + react-native-web):
 *   1. Login com credenciais de cidadão (login.tsx).
 *   2. Navegação até "Nova demanda" pela tab bar (_layout.tsx).
 *   3. Preenchimento do formulário e aceite dos termos (demandas/nova.tsx).
 *   4. Submissão e verificação do protocolo gerado na tela de detalhe (demandas/[id].tsx).
 *   5. Confirmação de que a demanda aparece na listagem "Minhas demandas" (demandas/index.tsx).
 */
test("cidadão registra uma nova demanda e a vê na listagem", async ({ page }) => {
  const titulo = `Buraco na via - teste e2e ${Date.now()}`;

  await page.goto("/login");

  await page.getByTestId("input-email").fill("cidadao@urbanize.com");
  await page.getByTestId("input-senha").fill("demo");
  await page.getByTestId("btn-entrar").click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("tab-/demandas/nova").click();
  await expect(page).toHaveURL(/\/demandas\/nova$/);

  await page.getByTestId("input-titulo").fill(titulo);
  await page.getByTestId("input-descricao").fill("Descrição gerada pelo teste E2E automatizado.");
  await page.getByTestId("input-endereco").fill("Rua de Teste, 123");
  await page.getByTestId("checkbox-aceite").click();

  await page.getByTestId("btn-registrar").click();

  await expect(page).toHaveURL(/\/demandas\/[^/]+$/, { timeout: 10_000 });
  await expect(page.getByText(/^URB-/)).toBeVisible();
  await expect(page.getByText(titulo).first()).toBeVisible();

  await page.getByTestId("tab-/demandas").click();
  await expect(page).toHaveURL(/\/demandas$/);
  await expect(page.getByText(titulo).first()).toBeVisible();
});
