import { expect, test } from "@playwright/test";

/**
 * Cenário: cidadão registra pela UI e, em outra sessão, o gestor aceita a triagem.
 * Complementa gestor-aceita-triagem.spec.ts (que cria a demanda pela API) cobrindo
 * a troca de papel de usuário e a persistência após reload.
 */
test("gestor aceita a triagem de uma demanda registrada pelo cidadão na UI", async ({ browser }) => {
  const titulo = `Vazamento de esgoto - teste e2e triagem ui ${Date.now()}`;

  const citizenContext = await browser.newContext();
  const citizenPage = await citizenContext.newPage();

  await citizenPage.goto("/login");
  await citizenPage.getByTestId("input-email").fill("cidadao@urbanize.com");
  await citizenPage.getByTestId("input-senha").fill("demo");
  await citizenPage.getByTestId("btn-entrar").click();
  await expect(citizenPage).toHaveURL(/\/dashboard$/);

  await citizenPage.getByTestId("tab-/demandas/nova").click();
  await expect(citizenPage).toHaveURL(/\/demandas\/nova$/);

  await citizenPage.getByTestId("input-titulo").fill(titulo);
  await citizenPage
    .getByTestId("input-descricao")
    .fill("Esgoto a céu aberto próximo à escola, gerado pelo teste E2E automatizado.");
  await citizenPage.getByTestId("input-endereco").fill("Rua de Teste, 456");
  await citizenPage.getByTestId("checkbox-aceite").click();
  await citizenPage.getByTestId("btn-registrar").click();

  await expect(citizenPage).toHaveURL(/\/demandas\/(?!nova$)[^/]+$/, { timeout: 10_000 });
  const protocolo = (await citizenPage.getByText(/^URB-/).textContent())!.trim();
  await citizenContext.close();

  const managerContext = await browser.newContext();
  const managerPage = await managerContext.newPage();

  await managerPage.goto("/login");
  await managerPage.getByTestId("input-email").fill("gestor@urbanize.com");
  await managerPage.getByTestId("input-senha").fill("demo");
  await managerPage.getByTestId("btn-entrar").click();
  await expect(managerPage).toHaveURL(/\/gestor$/);

  const triagemCard = managerPage.getByTestId(`triagem-${protocolo}`);
  await expect(triagemCard).toBeVisible({ timeout: 10_000 });
  await expect(triagemCard).toContainText(titulo);
  await expect(triagemCard.getByText(/% confiança/)).toBeVisible();

  await managerPage.getByTestId(`btn-aceitar-${protocolo}`).click();
  await expect(triagemCard).toHaveCount(0);

  // persistido no backend: continua fora da fila após recarregar
  await managerPage.reload();
  await expect(managerPage.getByText("Painel do gestor")).toBeVisible();
  await expect(managerPage.getByTestId(`triagem-${protocolo}`)).toHaveCount(0);

  await managerContext.close();
});
