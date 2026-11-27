/**
 * Validação de formulários no app. As regras espelham os schemas zod do backend
 * (authController e demandController) para o usuário ver o erro antes de enviar.
 */
export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS = /^\d{10,11}$/;

export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RULE = `A senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} caracteres, com letra e número.`;

/** Mesma regra do backend (authController). */
export const isStrongPassword = (senha: string) =>
  senha.length >= MIN_PASSWORD_LENGTH && /\p{L}/u.test(senha) && /\d/.test(senha);

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim());

export function validateLogin(input: { email: string; senha: string }) {
  const errors: FieldErrors<"email" | "senha"> = {};
  if (!input.email.trim()) errors.email = "Informe o email.";
  else if (!isValidEmail(input.email)) errors.email = "Email inválido.";
  if (!input.senha) errors.senha = "Informe a senha.";
  return errors;
}

export function validateSignup(input: { nome: string; email: string; senha: string; telefone?: string }) {
  const errors: FieldErrors<"nome" | "email" | "senha" | "telefone"> = { ...validateLogin(input) };
  if (input.nome.trim().length < 2) errors.nome = "Informe seu nome (mínimo 2 letras).";
  if (input.senha && !isStrongPassword(input.senha)) errors.senha = PASSWORD_RULE;
  const telefone = input.telefone?.replace(/\D/g, "");
  if (telefone && !PHONE_DIGITS.test(telefone)) errors.telefone = "Use DDD + número (10 ou 11 dígitos).";
  return errors;
}

export function validateDemand(input: { titulo: string; descricao: string; endereco: string; aceite: boolean }) {
  const errors: FieldErrors<"titulo" | "descricao" | "endereco" | "aceite"> = {};
  if (input.titulo.trim().length < 3) errors.titulo = "O título precisa de pelo menos 3 caracteres.";
  if (input.descricao.trim().length < 5) errors.descricao = "Descreva o problema (mínimo 5 caracteres).";
  if (input.endereco.trim().length < 3) errors.endereco = "Informe a rua ou use a localização do aparelho.";
  if (!input.aceite) errors.aceite = "É preciso concordar em compartilhar os dados com o órgão.";
  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
