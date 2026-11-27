import { z } from "zod";

/**
 * RS02: regra para senhas novas. Não vale no login, para não bloquear contas antigas.
 * O máximo de 72 existe porque o bcrypt ignora o que passa disso.
 */
export const newPasswordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.")
  .regex(/\p{L}/u, "A senha deve ter pelo menos uma letra.")
  .regex(/\d/, "A senha deve ter pelo menos um número.");
