import { signUploadUrl } from "./signedUpload";
import { Demand, DemandHistory } from "../generated/prisma/client";

type DemandWithHistory = Demand & { historico: DemandHistory[] };

export const toDemandResponse = (demand: DemandWithHistory) => ({
  id: demand.id,
  protocolo: demand.protocolo,
  titulo: demand.titulo,
  descricao: demand.descricao,
  categoria: demand.categoria,
  prioridade: demand.prioridade,
  status: demand.status,
  nomeSolicitante: demand.nomeSolicitante,
  emailSolicitante: demand.emailSolicitante,
  telefoneSolicitante: demand.telefoneSolicitante ?? undefined,
  endereco: {
    endereco: demand.endereco,
    bairro: demand.bairro,
    cidade: demand.cidade,
    referencia: demand.referencia ?? undefined,
    latitude: demand.latitude ?? undefined,
    longitude: demand.longitude ?? undefined,
  },
  origem: demand.origem,
  orgaoResponsavel: demand.orgaoResponsavel ?? undefined,
  imagemUrl: signUploadUrl(demand.imagemUrl),
  observacaoGestor: demand.observacaoGestor ?? undefined,
  scoreTriagem: demand.scoreTriagem ?? undefined,
  sugestaoEncaminhamento: demand.sugestaoEncaminhamento ?? undefined,
  criadaEm: demand.createdAt.toISOString(),
  atualizadaEm: demand.updatedAt.toISOString(),
  historico: demand.historico.map((item) => ({
    id: item.id,
    status: item.status,
    descricao: item.descricao,
    data: item.createdAt.toISOString(),
    autor: item.autor,
  })),
});

export type DemandResponse = ReturnType<typeof toDemandResponse>;
