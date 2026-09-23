import { prisma } from "../src/config/prisma";

const E2E_TITULO_PREFIXES = [
  "Buraco na via - teste e2e",
  "Poste apagado - teste e2e gestor",
  "Lâmpada queimada - teste e2e triagem",
  "Vazamento de esgoto - teste e2e triagem ui",
];

async function main() {
  const { count } = await prisma.demand.deleteMany({
    where: { OR: E2E_TITULO_PREFIXES.map((prefix) => ({ titulo: { startsWith: prefix } })) },
  });
  console.log(`[e2e-cleanup] ${count} demanda(s) de execuções anteriores removida(s).`);
  await prisma.$disconnect();
}

main();
