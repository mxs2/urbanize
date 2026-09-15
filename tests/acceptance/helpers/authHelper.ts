import request from "supertest";
import { app } from "../../../backend/src/app";

export interface AuthSession {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    role: "cidadao" | "gestor";
    organId?: string;
  };
}

export const getCidadaoSession = async (): Promise<AuthSession> => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "cidadao@urbanize.com", senha: "demo" });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Falha ao obter sessão de cidadão demo: ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.data.token,
    user: res.body.data.user,
  };
};

export const getGestorSession = async (): Promise<AuthSession> => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "gestor@urbanize.com", senha: "demo" });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Falha ao obter sessão de gestor demo: ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.data.token,
    user: res.body.data.user,
  };
};

export const createUniqueUser = async (
  role: "cidadao" | "gestor" = "cidadao",
  prefix: string = "user"
): Promise<AuthSession> => {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `${prefix}-${unique}@urbanize.test`;
  const nome = `Teste ${prefix.toUpperCase()} ${unique}`;

  const res = await request(app)
    .post("/api/auth/register")
    .send({
      nome,
      email,
      senha: "senhaSegura123",
      telefone: "81988887777",
      role,
    });

  if (res.status !== 201 || !res.body?.data?.token) {
    throw new Error(`Falha ao criar usuário de teste: ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.data.token,
    user: res.body.data.user,
  };
};
