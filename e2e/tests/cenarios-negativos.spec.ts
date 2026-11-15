import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000/api";

const loginCidadao = async (page: import("@playwright/test").Page) => {
  await page.goto("/login");
  await page.getByTestId("input-email").fill("cidadao@urbanize.com");
  await page.getByTestId("input-senha").fill("demo");
  await page.getByTestId("btn-entrar").click();
  await expect(page).toHaveURL(/\/dashboard$/);
};

/**
 * Cenário negativo: cidadão tenta entrar na área do gestor.
 *
 *   1. Login como cidadão.
 *   2. Acesso direto a /gestor pela URL: o guard de perfil (useRoleGuard) recusa e
 *      devolve o cidadão ao próprio painel, sem renderizar o "Painel do gestor".
 *   3. A tab bar do cidadão não oferece o link para o painel do gestor.
 *   4. A mesma recusa existe no backend: com o token do cidadão, alterar status de
 *      uma demanda (ação exclusiva do gestor) responde 403 FORBIDDEN.
 */
test("cidadão tenta acessar a área do gestor e é recusado", async ({ page, request }) => {
  await loginCidadao(page);

  await page.goto("/gestor");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Painel do gestor")).toHaveCount(0);
  await expect(page.getByTestId("tab-/gestor")).toHaveCount(0);

  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: "cidadao@urbanize.com", senha: "demo" },
  });
  const token = (await login.json()).data.token;
  const lista = await request.get(`${API_URL}/demands`, { headers: { Authorization: `Bearer ${token}` } });
  const [demanda] = (await lista.json()).data;
  expect(demanda, "seed precisa ter ao menos uma demanda do cidadão demo").toBeTruthy();

  const patch = await request.patch(`${API_URL}/demands/${demanda.id}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status: "resolvida" },
  });
  expect(patch.status()).toBe(403);
});

/**
 * Cenário negativo: envio de demanda com campo obrigatório vazio.
 *
 *   1. Login como cidadão e navegação até "Nova demanda".
 *   2. Título e descrição preenchidos, aceite marcado, mas "Endereço/Rua" vazio.
 *   3. Ao tocar em "Registrar demanda", a tela exibe "Preencha os campos obrigatórios.",
 *      continua em /demandas/nova e nenhuma requisição de criação chega à API.
 */
test("cidadão envia demanda com endereço vazio e vê o erro na tela", async ({ page }) => {
  await loginCidadao(page);

  await page.getByTestId("tab-/demandas/nova").click();
  await expect(page).toHaveURL(/\/demandas\/nova$/);

  let criacoes = 0;
  page.on("request", (req) => {
    if (req.method() === "POST" && /\/api\/demands\/?$/.test(req.url())) criacoes++;
  });

  await page.getByTestId("input-titulo").fill(`Calçada quebrada - teste e2e negativo ${Date.now()}`);
  await page.getByTestId("input-descricao").fill("Demanda sem endereço, criada pelo teste E2E negativo.");
  await page.getByTestId("input-endereco").fill("");
  await page.getByTestId("checkbox-aceite").click();

  await page.getByTestId("btn-registrar").click();

  await expect(page.getByTestId("erro-formulario")).toHaveText("Preencha os campos obrigatórios.");
  await expect(page).toHaveURL(/\/demandas\/nova$/);
  expect(criacoes).toBe(0);
});
