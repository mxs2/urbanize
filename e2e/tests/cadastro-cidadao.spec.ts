import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000/api";

/**
 * TC12 - Cidadão cria a conta pela tela de cadastro (cadastro.tsx) e o usuário
 * fica persistido: o login pela API com as mesmas credenciais retorna o perfil cidadão.
 */
test("cidadão cria conta pela tela de cadastro", async ({ page, request }) => {
  const email = `novo12-${Date.now()}@urbanize.test`;

  await page.goto("/cadastro");

  await page.getByTestId("input-nome").fill("Maria Silva");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill("demo");
  await page.getByText("Cidadão", { exact: true }).click();
  await page.getByTestId("btn-criar-conta").click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });

  const login = await request.post(`${API_URL}/auth/login`, { data: { email, senha: "demo" } });
  expect(login.status()).toBe(200);
  expect((await login.json()).data.user.role).toBe("cidadao");
});
