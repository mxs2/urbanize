import { DemandCategory } from "@/types/demand";

export const categoryLabel: Record<DemandCategory, string> = {
  vias_publicas: "Buraco na rua",
  iluminacao_publica: "Poste ou fiação caída",
  coleta_de_lixo: "Lixo acumulado na rua",
  saneamento: "Saneamento",
  fiscalizacao: "Fiscalização",
  zeladoria: "Zeladoria",
  outros: "Outros",
};
