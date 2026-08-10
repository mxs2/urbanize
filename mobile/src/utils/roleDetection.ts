import { DemandRole } from "@/types/user";

// Detecta o perfil pelo domínio do email
export function detectRoleFromEmail(email: string): DemandRole {
  const lowercaseEmail = email.toLowerCase().trim();

  if (lowercaseEmail.includes("@gestorurbanize.com")) {
    return "gestor";
  }

  if (lowercaseEmail === "gestor@urbanize.com") {
    return "gestor";
  }

  return "cidadao";
}
