import { prisma } from "../config/prisma";
import { DemandCategory } from "../generated/prisma/client";

export const organService = {
  async list() {
    return prisma.organ.findMany({ orderBy: { nome: "asc" } });
  },

  async findByCategoria(categoria: DemandCategory) {
    const organs = await prisma.organ.findMany();
    return (
      organs.find((o) => {
        const cats: DemandCategory[] = JSON.parse(o.categoriasJson);
        return cats.includes(categoria);
      }) ?? null
    );
  },

  buildWhatsappLink(organ: { whatsapp: string | null; nome: string }, protocolo: string, titulo: string) {
    if (!organ.whatsapp) return null;
    const msg = encodeURIComponent(
      `Olá, ${organ.nome}! Registrei a demanda "${titulo}" pelo Urbanize (protocolo ${protocolo}). Por favor, verifiquem.`
    );
    return `https://wa.me/${organ.whatsapp.replace(/\D/g, "")}?text=${msg}`;
  },

  buildEmailLink(organ: { email: string | null; nome: string }, protocolo: string, titulo: string) {
    if (!organ.email) return null;
    const subject = encodeURIComponent(`[Urbanize] Demanda ${protocolo}`);
    const body = encodeURIComponent(
      `Olá, ${organ.nome}.\n\nRegistrei a demanda "${titulo}" pelo sistema Urbanize.\nProtocolo: ${protocolo}\n\nPor favor, verifiquem.`
    );
    return `mailto:${organ.email}?subject=${subject}&body=${body}`;
  },
};
