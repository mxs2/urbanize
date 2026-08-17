import { DemandCategory, DemandPriority, DemandStatus, Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";

export interface DemandFilters {
  status?: DemandStatus;
  categoria?: DemandCategory;
  prioridade?: DemandPriority;
  bairro?: string;
  busca?: string;
  userId?: string;
  organId?: string;
}

const includeHistory = {
  historico: { orderBy: { createdAt: "asc" as const } },
};

export const demandRepository = {
  list(filters: DemandFilters) {
    const where: Prisma.DemandWhereInput = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.organId ? { organId: filters.organId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.categoria ? { categoria: filters.categoria } : {}),
      ...(filters.prioridade ? { prioridade: filters.prioridade } : {}),
      ...(filters.bairro ? { bairro: { equals: filters.bairro } } : {}),
      ...(filters.busca
        ? {
            OR: [
              { titulo: { contains: filters.busca } },
              { descricao: { contains: filters.busca } },
              { protocolo: { contains: filters.busca } },
            ],
          }
        : {}),
    };

    return prisma.demand.findMany({
      where,
      include: includeHistory,
      orderBy: { createdAt: "desc" },
    });
  },
  findById(id: string) {
    return prisma.demand.findUnique({ where: { id }, include: includeHistory });
  },
  create(data: Prisma.DemandCreateInput) {
    return prisma.demand.create({ data, include: includeHistory });
  },
  updateStatus(
    id: string,
    data: { status: DemandStatus; observacaoGestor?: string; descricao: string; autor: string }
  ) {
    return prisma.demand.update({
      where: { id },
      data: {
        status: data.status,
        observacaoGestor: data.observacaoGestor,
        historico: {
          create: {
            status: data.status,
            descricao: data.descricao,
            autor: data.autor,
          },
        },
      },
      include: includeHistory,
    });
  },
  countByStatus(where?: Prisma.DemandWhereInput) {
    return prisma.demand.groupBy({ by: ["status"], where, _count: { _all: true } });
  },
  countByCategory(where?: Prisma.DemandWhereInput) {
    return prisma.demand.groupBy({ by: ["categoria"], where, _count: { _all: true } });
  },
  count(where?: Prisma.DemandWhereInput) {
    return prisma.demand.count({ where });
  },
};
