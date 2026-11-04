import { prisma } from "../src/config/prisma";

const E2E_TITULO_PREFIXES = [
  "Buraco na via - teste e2e",
  "Poste apagado - teste e2e gestor",
  "Lâmpada queimada - teste e2e triagem",
  "Vazamento de esgoto - teste e2e triagem ui",
  "Filtro status - teste e2e",
];

const E2E_CADASTRO_EMAIL_PREFIXES = ["novo12-", "filtro62-"];

async function main() {
  const { count } = await prisma.demand.deleteMany({
    where: { OR: E2E_TITULO_PREFIXES.map((prefix) => ({ titulo: { startsWith: prefix } })) },
  });
  console.log(`[e2e-cleanup] ${count} demanda(s) de execuções anteriores removida(s).`);

  const { count: usuarios } = await prisma.user.deleteMany({
    where: { OR: E2E_CADASTRO_EMAIL_PREFIXES.map((prefix) => ({ email: { startsWith: prefix, endsWith: "@urbanize.test" } })) },
  });
  console.log(`[e2e-cleanup] ${usuarios} usuário(s) de cadastro de execuções anteriores removido(s).`);
  await prisma.$disconnect();
}

main();
