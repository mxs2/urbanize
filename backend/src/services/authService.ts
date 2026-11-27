import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../generated/prisma/client";
import { env } from "../config/env";
import { userRepository } from "../repositories/userRepository";
import { AppError } from "../utils/appError";
import { sessionService } from "./sessionService";

const publicUser = (user: User) => ({
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
  async register(input: { nome: string; email: string; senha: string; telefone?: string }) {
    const exists = await userRepository.findByEmail(input.email);
    if (exists) throw new AppError("Email já cadastrado.", 409, "EMAIL_ALREADY_EXISTS");

    const senhaHash = await bcrypt.hash(input.senha, 10);
    const user = await userRepository.create({ ...input, senhaHash });
    return authenticated(user, await sessionService.start(user.id));
  },
  async login(input: { email: string; senha: string }) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new AppError("Credenciais inválidas.", 401, "INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(input.senha, user.senhaHash);
    if (!valid) throw new AppError("Credenciais inválidas.", 401, "INVALID_CREDENTIALS");

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
    actor: { organId?: string | null; acessoGeral: boolean }
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

    return publicUser(await userRepository.promoteToGestor(user.id, organId));
  },
  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    return publicUser(user);
  },
};
