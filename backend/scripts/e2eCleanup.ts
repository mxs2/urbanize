import { prisma } from "../src/config/prisma";

const E2E_TITULO_PREFIX = "Buraco na via - teste e2e";

async function main() {
  const { count } = await prisma.demand.deleteMany({
    where: { titulo: { startsWith: E2E_TITULO_PREFIX } },
  });
  console.log(`[e2e-cleanup] ${count} demanda(s) de execuções anteriores removida(s).`);
  await prisma.$disconnect();
}

main();
