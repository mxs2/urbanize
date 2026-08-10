import { DemandStatus } from "@/types/demand";

export const statusLabel: Record<DemandStatus, string> = {
  registrada: "Registrada",
  em_analise: "Em análise",
  encaminhada: "Encaminhada",
  em_atendimento: "Em atendimento",
  resolvida: "Resolvida",
  cancelada: "Cancelada",
};

export const statusColor: Record<DemandStatus, string> = {
  registrada: "#c99a1f",
  em_analise: "#e8a23a",
  encaminhada: "#2b82d4",
  em_atendimento: "#1f9ea3",
  resolvida: "#1f9e64",
  cancelada: "#d64545",
};
