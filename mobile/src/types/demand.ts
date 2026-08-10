export type DemandStatus =
  | "registrada"
  | "em_analise"
  | "encaminhada"
  | "em_atendimento"
  | "resolvida"
  | "cancelada";

export type DemandCategory =
  | "vias_publicas"
  | "iluminacao_publica"
  | "coleta_de_lixo"
  | "saneamento"
  | "fiscalizacao"
  | "zeladoria"
  | "outros";

export type DemandPriority = "baixa" | "media" | "alta";
export type DemandSource = "cidadao" | "sistema_externo" | "orgao";

export interface Address {
  endereco: string;
  bairro: string;
  cidade: string;
  referencia?: string;
  latitude?: number;
  longitude?: number;
}

export interface DemandHistoryItem {
  id: string;
  status: DemandStatus;
  descricao: string;
  data: string;
  autor: string;
}

export interface Demand {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: DemandCategory;
  prioridade: DemandPriority;
  status: DemandStatus;
  nomeSolicitante: string;
  emailSolicitante: string;
  telefoneSolicitante?: string;
  endereco: Address;
  origem: DemandSource;
  orgaoResponsavel?: string;
  imagemUrl?: string;
  observacaoGestor?: string;
  scoreTriagem?: number;
  sugestaoEncaminhamento?: string;
  criadaEm: string;
  atualizadaEm: string;
  historico: DemandHistoryItem[];
}

export interface FilterState {
  busca?: string;
  status?: DemandStatus;
  categoria?: DemandCategory;
  bairro?: string;
  prioridade?: DemandPriority;
}
