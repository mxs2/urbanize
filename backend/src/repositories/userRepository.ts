import { prisma } from "../config/prisma";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  async organExists(id: string) {
    return Boolean(await prisma.organ.findUnique({ where: { id }, select: { id: true } }));
  },
  promoteToGestor(id: string, organId: string) {
    return prisma.user.update({ where: { id }, data: { role: "gestor", organId } });
  },
  /** Volta a cidadão e encerra as sessões, na mesma transação. */
  async demoteGestor(id: string) {
    const [user] = await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { role: "cidadao", organId: null } }),
      prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    return user;
  },
  create(data: { nome: string; email: string; senhaHash: string; telefone?: string }) {
    return prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email.toLowerCase(),
        senhaHash: data.senhaHash,
        telefone: data.telefone,
        role: "cidadao",
      },
    });
  },
};

export type UserEntity = ReturnType<typeof userRepository.findById>;
