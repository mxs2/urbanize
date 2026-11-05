import { prisma } from "../config/prisma";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
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
