import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../generated/prisma/client";
import { env } from "../config/env";
import { userRepository } from "../repositories/userRepository";
import { AppError } from "../utils/appError";
import { sessionService } from "./sessionService";
import { auditService } from "./auditService";

export const publicUser = (user: User) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  telefone: user.telefone ?? undefined,
  role: user.role,
  organId: user.organId ?? undefined,
});

const signToken = (user: User, sessionId: string) =>
  jwt.sign({ role: user.role, email: user.email, sid: sessionId }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);

const authenticated = (user: User, session: { sessionId: string; refreshToken: string }) => ({
  user: publicUser(user),
  token: signToken(user, session.sessionId),
  refreshToken: session.refreshToken,
});

export const authService = {
  async register(input: { nome: string; email: string; senha: string; telefone?: string }, ip?: string) {
    const exists = await userRepository.findByEmail(input.email);
    if (exists) throw new AppError("Email já cadastrado.", 409, "EMAIL_ALREADY_EXISTS");

    const senhaHash = await bcrypt.hash(input.senha, 10);
    const user = await userRepository.create({ ...input, senhaHash });
    await auditService.record("cadastro", { userId: user.id, ip });
    return authenticated(user, await sessionService.start(user.id));
  },
  async login(input: { email: string; senha: string }, ip?: string) {
    const user = await userRepository.findByEmail(input.email);
    const valid = user ? await bcrypt.compare(input.senha, user.senhaHash) : false;
    if (!user || !valid) {
      await auditService.record("login_falha", { userId: user?.id, ip });
      throw new AppError("Credenciais inválidas.", 401, "INVALID_CREDENTIALS");
    }
    await auditService.record("login_sucesso", { userId: user.id, ip });

    return authenticated(user, await sessionService.start(user.id));
  },
  async refresh(refreshToken: string) {
    const session = await sessionService.rotate(refreshToken);
    const user = await userRepository.findById(session.userId);
    if (!user) throw new AppError("Usuário não encontrado.", 401, "UNAUTHENTICATED");
    return authenticated(user, session);
  },
  /** Encerra a sessão identificada pelo refresh token e/ou pelo token de acesso. */
  async logout({ refreshToken, accessToken }: { refreshToken?: string; accessToken?: string }) {
    if (refreshToken) await sessionService.revokeByToken(refreshToken);
    if (!accessToken) return;
    try {
      // Expirado ainda vale para sair; a assinatura continua sendo exigida.
      const { sid } = jwt.verify(accessToken, env.jwtSecret, { ignoreExpiration: true }) as { sid?: string };
      if (sid) await sessionService.revoke(sid);
    } catch {
      // Token inválido: nada a revogar.
    }
  },
  /**
   * Novos gestores: a pessoa se cadastra como cidadã e um gestor a promove.
   * Gestor de um órgão só promove para o próprio órgão; o de acesso geral escolhe.
   * `acessoGeral` nunca é concedido por aqui.
   */
  async promoteGestor(
    input: { email: string; organId?: string },
    actor: { id: string; organId?: string | null; acessoGeral: boolean },
    ip?: string
  ) {
    const organId = input.organId ?? actor.organId ?? undefined;
    if (!organId) throw new AppError("Informe o órgão do novo gestor.", 422, "ORGAN_REQUIRED");
    if (!actor.acessoGeral && organId !== actor.organId) {
      throw new AppError("Você só pode adicionar gestores ao seu órgão.", 403, "FORBIDDEN");
    }
    if (!(await userRepository.organExists(organId))) {
      throw new AppError("Órgão não encontrado.", 404, "ORGAN_NOT_FOUND");
    }

    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    if (user.role === "gestor") throw new AppError("Usuário já é gestor.", 409, "ALREADY_GESTOR");

    const promoted = await userRepository.promoteToGestor(user.id, organId);
    await auditService.record("troca_papel", { userId: actor.id, alvoId: user.id, ip });
    return publicUser(promoted);
  },
  /**
   * Descredenciamento: o gestor volta a ser cidadão e, a partir daí, pode excluir a própria
   * conta. Contas de acesso geral só mudam fora da API, como na concessão.
   */
  async demoteGestor(
    email: string,
    actor: { id: string; organId?: string | null; acessoGeral: boolean },
    ip?: string
  ) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    // Impede que o órgão fique sem gestor por engano.
    if (user.id === actor.id) {
      throw new AppError("Peça a outro gestor para fazer o seu descredenciamento.", 403, "FORBIDDEN");
    }
    if (user.role !== "gestor") throw new AppError("Usuário não é gestor.", 409, "NOT_GESTOR");
    if (user.acessoGeral || (!actor.acessoGeral && (!actor.organId || user.organId !== actor.organId))) {
      throw new AppError("Você não pode descredenciar este gestor.", 403, "FORBIDDEN");
    }

    const demoted = await userRepository.demoteGestor(user.id);
    await auditService.record("troca_papel", { userId: actor.id, alvoId: user.id, ip });
    return publicUser(demoted);
  },
  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    return publicUser(user);
  },
};
