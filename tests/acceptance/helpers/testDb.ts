import { prisma } from "../../../backend/src/config/prisma";

export const testDb = {
  prisma,
  async cleanTestData(userEmailSuffix: string = "@urbanize.test") {
    // Remove histórico e demandas geradas por usuários com sufixo de teste
    const testUsers = await prisma.user.findMany({
      where: { email: { contains: userEmailSuffix } },
      select: { id: true },
    });

    const userIds = testUsers.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.demandHistory.deleteMany({
        where: { demand: { userId: { in: userIds } } },
      });
      await prisma.demand.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  },
  async disconnect() {
    await prisma.$disconnect();
  },
};
