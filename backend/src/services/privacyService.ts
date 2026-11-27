import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { signUploadUrl } from "../utils/signedUpload";
import { anonymizeContact, removeOrphanPhotos } from "./anonymizationService";
import { auditService } from "./auditService";
import { publicUser } from "./authService";

const findUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
  return user;
};

/** 403, e não 401: um 401 faria o app tentar renovar a sessão. */
const confirmPassword = async (senha: string | undefined, senhaHash: string) => {
  if (!senha || !(await bcrypt.compare(senha, senhaHash))) {
    throw new AppError("Senha atual incorreta.", 403, "INVALID_PASSWORD");
  }
};

export const privacyService = {
  /** RS18: cópia dos dados pessoais do titular, sem hash de senha nem tokens. */
  async exportData(userId: string, ip?: string) {
    const user = await findUser(userId);
    const [demands, sessoes] = await Promise.all([
      prisma.demand.findMany({
        where: { userId },
        include: { historico: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.refreshToken.findMany({ where: { userId }, select: { createdAt: true, expiresAt: true, revokedAt: true } }),
    ]);
    await auditService.record("exportacao_dados", { userId, ip });
    const registros = await prisma.auditLog.findMany({
      where: { userId },
      select: { evento: true, ip: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return {
      geradoEm: new Date().toISOString(),
      usuario: { ...publicUser(user), criadoEm: user.createdAt, atualizadoEm: user.updatedAt },
      demandas: demands.map(({ userId: _userId, organId: _organId, historico, imagemUrl, ...demand }) => ({
        ...demand,
        imagemUrl: signUploadUrl(imagemUrl),
        // Nomes de gestores são dados de terceiros e não entram na cópia.
        historico: historico.map(({ status, descricao, autor, createdAt }) => ({
          status,
          descricao,
          autor: status === "registrada" ? autor : "Gestão pública",
          data: createdAt,
        })),
      })),
      sessoes,
      registrosDeAcesso: registros,
    };
  },

  /** RS19: corrige os dados da conta e as cópias deles nas demandas do próprio titular. */
  async update(
    userId: string,
    input: { nome?: string; email?: string; telefone?: string | null; senhaAtual?: string },
    ip?: string
  ) {
    const current = await findUser(userId);
    const email = input.email?.toLowerCase();

    if (email && email !== current.email) {
      await confirmPassword(input.senhaAtual, current.senhaHash);
      if (await prisma.user.findUnique({ where: { email } })) {
        throw new AppError("Email já cadastrado.", 409, "EMAIL_ALREADY_EXISTS");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { nome: input.nome, email, telefone: input.telefone },
      });
      // Só as cópias do próprio titular: demandas abertas em nome de outra pessoa não mudam.
      const own = await tx.demand.findMany({ where: { userId, emailSolicitante: current.email } });
      for (const demand of own) {
        const samePhone = demand.telefoneSolicitante !== null && demand.telefoneSolicitante === current.telefone;
        await tx.demand.update({
          where: { id: demand.id },
          data: {
            nomeSolicitante: user.nome,
            emailSolicitante: user.email,
            telefoneSolicitante: samePhone ? user.telefone : demand.telefoneSolicitante,
            updatedAt: demand.updatedAt,
          },
        });
        await tx.demandHistory.updateMany({
          where: { demandId: demand.id, status: "registrada" },
          data: { autor: user.nome },
        });
      }
      return user;
    });

    await auditService.record("correcao_dados", { userId, ip });
    return publicUser(updated);
  },

  /**
   * RS17 + RS13: exclui a conta. As demandas ficam no histórico da gestão pública sem
   * contato, nome, ponto de referência, coordenadas nem foto.
   */
  async deleteAccount(userId: string, senha: string, ip?: string) {
    const user = await findUser(userId);
    // O nome do gestor assina atos da gestão pública; a baixa é feita pelo órgão.
    if (user.role === "gestor") {
      throw new AppError("Peça o descredenciamento a outro gestor antes de excluir a conta.", 403, "FORBIDDEN");
    }
    await confirmPassword(senha, user.senhaHash);

    const photos = await prisma.$transaction(async (tx) => {
      const demands = await tx.demand.findMany({ where: { userId } });
      for (const demand of demands) {
        await anonymizeContact(tx, demand, { referencia: null, latitude: null, longitude: null, imagemUrl: null });
      }
      // Os refresh tokens caem em cascata e as demandas ficam sem `userId`.
      await tx.user.delete({ where: { id: userId } });
      return demands.flatMap((demand) => (demand.imagemUrl ? [demand.imagemUrl] : []));
    });

    await removeOrphanPhotos(photos);
    await auditService.record("exclusao_conta", { userId, ip });
  },
};
