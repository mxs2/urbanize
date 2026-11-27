import {
  DemandCategory,
  DemandPriority,
  DemandSource,
  DemandStatus,
} from "../generated/prisma/client";
import { demandRepository, DemandFilters } from "../repositories/demandRepository";
import { AppError } from "../utils/appError";
import { toDemandResponse } from "../utils/demandMapper";
import { notificationService } from "./notificationService";
import { organService } from "./organService";
import { Actor, canAccessDemand, demandScope } from "../utils/demandScope";
import { invalidateMetrics } from "./metricsService";
import { prisma } from "../config/prisma";

const categoryToDepartment: Record<DemandCategory, string> = {
  vias_publicas: "Secretaria de Obras",
  iluminacao_publica: "Iluminação Urbana",
  coleta_de_lixo: "Limpeza Urbana",
  saneamento: "Secretaria de Saneamento",
  fiscalizacao: "Fiscalização Urbana",
  zeladoria: "Zeladoria Municipal",
  outros: "Central de Atendimento",
};

const generateProtocol = () => `URB-${Math.floor(Math.random() * 90000 + 10000)}`;

const ensureAllowed = (demand: Awaited<ReturnType<typeof demandRepository.findById>>, user: Actor) => {
  if (!demand) throw new AppError("Demanda não encontrada.", 404, "DEMAND_NOT_FOUND");
  if (!canAccessDemand(user, demand)) {
    throw new AppError("Você não tem permissão para acessar esta demanda.", 403, "FORBIDDEN");
  }
  return demand;
};

export const demandService = {
  async list(filters: Omit<DemandFilters, "userId">, user: Actor) {
    // O escopo vem depois dos filtros do cliente, para que nenhum deles o sobrescreva.
    const demands = await demandRepository.list({ ...filters, ...demandScope(user) });
    return demands.map(toDemandResponse);
  },
  async getById(id: string, user: Actor) {
    const demand = ensureAllowed(await demandRepository.findById(id), user);
    return toDemandResponse(demand);
  },
  async create(
    input: {
      titulo: string;
      descricao: string;
      categoria: DemandCategory;
      prioridade?: DemandPriority;
      nomeSolicitante?: string;
      emailSolicitante?: string;
      telefoneSolicitante?: string;
      endereco: {
        endereco: string;
        bairro?: string;
        cidade?: string;
        referencia?: string;
        latitude?: number;
        longitude?: number;
      };
      origem?: DemandSource;
      imagemUrl?: string;
    },
    user: { id: string; nome: string; email: string }
  ) {
    let protocolo = generateProtocol();
    for (let i = 0; i < 5; i += 1) {
      const exists = await demandRepository.list({ busca: protocolo });
      if (exists.length === 0) break;
      protocolo = generateProtocol();
    }

    // Busca órgão responsável pelo banco, com fallback para mapa estático
    const organ = await organService.findByCategoria(input.categoria);
    const sugestaoEncaminhamento = organ?.nome ?? categoryToDepartment[input.categoria];
    const scoreTriagem = input.categoria === "outros" ? 0.55 : 0.82;

    const demand = await demandRepository.create({
      protocolo,
      titulo: input.titulo,
      descricao: input.descricao,
      categoria: input.categoria,
      prioridade: input.prioridade ?? "media",
      status: "em_analise",
      nomeSolicitante: input.nomeSolicitante ?? user.nome,
      emailSolicitante: input.emailSolicitante ?? user.email,
      telefoneSolicitante: input.telefoneSolicitante,
      endereco: input.endereco.endereco,
      bairro: input.endereco.bairro ?? "Não informado",
      cidade: input.endereco.cidade ?? "Recife",
      referencia: input.endereco.referencia,
      latitude: input.endereco.latitude,
      longitude: input.endereco.longitude,
      origem: input.origem ?? "cidadao",
      imagemUrl: input.imagemUrl,
      scoreTriagem,
      sugestaoEncaminhamento,
      user: { connect: { id: user.id } },
      ...(organ ? { organ: { connect: { id: organ.id } } } : {}),
      historico: {
        create: [
          { status: "registrada", descricao: "Registrada pelo cidadão", autor: user.nome },
          {
            status: "em_analise",
            descricao: `Triagem automática: ${sugestaoEncaminhamento}`,
            autor: "Sistema",
          },
        ],
      },
    });

    await invalidateMetrics(organ?.id);
    return toDemandResponse(demand);
  },
  /** O papel é exigido na rota (`requireRole`); aqui vale o escopo por órgão. */
  async updateStatus(
    id: string,
    input: { status: DemandStatus; observacaoGestor?: string },
    user: Actor & { nome: string }
  ) {
    const current = ensureAllowed(await demandRepository.findById(id), user);

    const updated = await demandRepository.updateStatus(id, {
      status: input.status,
      observacaoGestor: input.observacaoGestor,
      descricao: input.observacaoGestor ?? "Atualização de status",
      autor: user.nome,
    });

    await invalidateMetrics(current.organId);
    // Sem await: o gestor não espera o Expo responder para ver a demanda atualizada.
    void notificationService.notifyStatusChange(updated);
    return toDemandResponse(updated);
  },
};
