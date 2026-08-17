import { Prisma, UserRole } from "../generated/prisma/client";
import { cache } from "../config/redis";
import { prisma } from "../config/prisma";
import { demandRepository } from "../repositories/demandRepository";

const toRecord = <T extends string>(items: Array<Record<T, string> & { _count: { _all: number } }>, key: T) =>
  items.reduce<Record<string, number>>((acc, item) => {
    acc[item[key]] = item._count._all;
    return acc;
  }, {});

export interface MetricsSummary {
  total: number;
  porStatus: Record<string, number>;
  porCategoria: Record<string, number>;
  tempoMedioAtendimentoDias: number;
}

export const calculateMetricsSummary = async (user?: {
  id: string;
  role: UserRole;
}): Promise<MetricsSummary> => {
  const where: Prisma.DemandWhereInput | undefined =
    user && user.role !== "gestor" ? { userId: user.id } : undefined;
  const cacheKey = where ? `metrics:summary:user:${user?.id}` : "metrics:summary:all";

  const cached = await cache.getJson<MetricsSummary>(cacheKey);
  if (cached) return cached;

  const [total, porStatus, porCategoria, resolvedDemands] = await Promise.all([
    demandRepository.count(where),
    demandRepository.countByStatus(where),
    demandRepository.countByCategory(where),
    prisma.demand.findMany({
      where: { ...where, status: "resolvida" },
      select: { createdAt: true, updatedAt: true },
    }),
  ]);

  const tempoMedioAtendimentoDias = resolvedDemands.length
    ? Number(
        (
          resolvedDemands.reduce(
            (sum, demand) => sum + (demand.updatedAt.getTime() - demand.createdAt.getTime()),
            0
          ) /
          resolvedDemands.length /
          86_400_000
        ).toFixed(1)
      )
    : 0;

  const summary = {
    total,
    porStatus: toRecord(porStatus, "status"),
    porCategoria: toRecord(porCategoria, "categoria"),
    tempoMedioAtendimentoDias,
  };

  await cache.setJson(cacheKey, summary, 60);
  return summary;
};

export const metricsService = {
  summary: calculateMetricsSummary,
  async persistSnapshot() {
    const summary = await calculateMetricsSummary();
    return prisma.metricsSnapshot.create({
      data: {
        total: summary.total,
        porStatusJson: JSON.stringify(summary.porStatus),
        porCategoriaJson: JSON.stringify(summary.porCategoria),
        tempoMedioAtendimentoDias: summary.tempoMedioAtendimentoDias,
      },
    });
  },
};
