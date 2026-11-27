import cron from "node-cron";
import { env } from "../config/env";
import { metricsService } from "../services/metricsService";
import { retentionService } from "../services/retentionService";

export const startMetricsJob = () => {
  if (!cron.validate(env.metricsCron)) {
    console.warn(`Cron de métricas inválido (${env.metricsCron}); job desativado.`);
    return;
  }

  cron.schedule(env.metricsCron, async () => {
    try {
      await metricsService.persistSnapshot();
      console.log("Snapshot periódico de métricas consolidado.");
    } catch (error) {
      console.error("Falha ao consolidar métricas.", error);
    }
  });
};

export const startRetentionJob = () => {
  if (!cron.validate(env.retentionCron)) {
    console.warn(`Cron de retenção inválido (${env.retentionCron}); job desativado.`);
    return;
  }

  cron.schedule(env.retentionCron, async () => {
    try {
      const { demandas, auditoria } = await retentionService.apply();
      console.log(`Retenção aplicada: ${demandas} demanda(s) anonimizada(s), ${auditoria} registro(s) apagado(s).`);
    } catch (error) {
      console.error("Falha ao aplicar a retenção de dados.", error);
    }
  });
};
