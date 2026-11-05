import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../generated/prisma/client";
import { env } from "../config/env";
import { userRepository } from "../repositories/userRepository";
import { AppError } from "../utils/appError";

const publicUser = (user: User) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  telefone: user.telefone ?? undefined,
  role: user.role,
  organId: user.organId ?? undefined,
});

const signToken = (user: User) =>
  jwt.sign({ role: user.role, email: user.email }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);

export const authService = {
  async register(input: { nome: string; email: string; senha: string; telefone?: string }) {
    const exists = await userRepository.findByEmail(input.email);
    if (exists) throw new AppError("Email já cadastrado.", 409, "EMAIL_ALREADY_EXISTS");

    const senhaHash = await bcrypt.hash(input.senha, 10);
    const user = await userRepository.create({ ...input, senhaHash });
    return { user: publicUser(user), token: signToken(user) };
  },
  async login(input: { email: string; senha: string }) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new AppError("Credenciais inválidas.", 401, "INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(input.senha, user.senhaHash);
    if (!valid) throw new AppError("Credenciais inválidas.", 401, "INVALID_CREDENTIALS");

    return { user: publicUser(user), token: signToken(user) };
  },
  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND");
    return publicUser(user);
  },
};
