import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000/api";

/**
 * TC62 - Cidadão aplica o filtro de status na listagem (demandas/index.tsx).
 *
 * Pré-condição (via API): um cidadão com duas demandas, uma em "Em análise" (status inicial
 * depois da triagem automática) e outra que o gestor muda para "Encaminhada".
 * Pela interface, o filtro "Em análise" deve deixar só a primeira na lista.
 */
test("cidadão filtra a listagem por status Em análise", async ({ page, request }) => {
  const sufixo = Date.now();
  const email = `filtro62-${sufixo}@urbanize.test`;
  const tituloAnalise = `Filtro status - teste e2e em analise ${sufixo}`;
  const tituloEncaminhada = `Filtro status - teste e2e encaminhada ${sufixo}`;

  const registro = await request.post(`${API_URL}/auth/register`, {
    data: { nome: "Cidadão Filtro", email, senha: "demo" },
  });
  expect(registro.status()).toBe(201);
  const tokenCidadao = (await registro.json()).data.token;

  const criar = async (titulo: string) => {
    const res = await request.post(`${API_URL}/demands`, {
      headers: { Authorization: `Bearer ${tokenCidadao}` },
      data: {
        titulo,
        descricao: "Demanda criada pelo teste E2E do filtro de status.",
        categoria: "coleta_de_lixo",
        endereco: { endereco: "Rua de Teste, 62", bairro: "Casa Forte", cidade: "Recife" },
      },
    });
    expect(res.status()).toBe(201);
    return (await res.json()).data;
  };
  const demandaAnalise = await criar(tituloAnalise);
  const demandaEncaminhada = await criar(tituloEncaminhada);

  const loginGestor = await request.post(`${API_URL}/auth/login`, {
    data: { email: "gestor@urbanize.com", senha: "demo" },
  });
  const tokenGestor = (await loginGestor.json()).data.token;
  const patch = await request.patch(`${API_URL}/demands/${demandaEncaminhada.id}/status`, {
    headers: { Authorization: `Bearer ${tokenGestor}` },
    data: { status: "encaminhada", observacaoGestor: "Encaminhada pelo teste E2E." },
  });
  expect(patch.status()).toBe(200);

  await page.goto("/login");
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-senha").fill("demo");
  await page.getByTestId("btn-entrar").click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByTestId("tab-/demandas").click();
  await expect(page).toHaveURL(/\/demandas$/);

  const cards = page.locator('[data-testid^="card-demanda-"]');
  await expect(cards).toHaveCount(2);

  await page.getByTestId("filtro-status-em_analise").click();
  await page.getByTestId("btn-aplicar-filtros").click();

  await expect(cards).toHaveCount(1);
  await expect(page.getByTestId(`card-demanda-${demandaAnalise.protocolo}`)).toBeVisible();
  await expect(page.getByTestId(`card-demanda-${demandaEncaminhada.protocolo}`)).toHaveCount(0);
});
