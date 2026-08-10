export interface Organ {
  id: string;
  nome: string;
  sigla: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  site: string | null;
  categoriasJson: string;
}

export const buildWhatsappLink = (organ: Organ, protocolo: string, titulo: string): string | null => {
  if (!organ.whatsapp) return null;
  const msg = encodeURIComponent(
    `Olá, ${organ.nome}! Registrei a demanda "${titulo}" pelo Urbanize (protocolo ${protocolo}). Por favor, verifiquem.`
  );
  return `https://wa.me/${organ.whatsapp.replace(/\D/g, "")}?text=${msg}`;
};

export const buildEmailLink = (organ: Organ, protocolo: string, titulo: string): string | null => {
  if (!organ.email) return null;
  const subject = encodeURIComponent(`[Urbanize] Demanda ${protocolo}`);
  const body = encodeURIComponent(
    `Olá, ${organ.nome}.\n\nRegistrei a demanda "${titulo}" pelo sistema Urbanize.\nProtocolo: ${protocolo}\n\nPor favor, verifiquem.`
  );
  return `mailto:${organ.email}?subject=${subject}&body=${body}`;
};
