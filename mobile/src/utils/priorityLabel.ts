import { DemandPriority } from "@/types/demand";

export const priorityLabel: Record<DemandPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const priorityColor: Record<DemandPriority, string> = {
  baixa: "#8a94a6",
  media: "#e8a23a",
  alta: "#d64545",
};
