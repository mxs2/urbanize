import cron from "node-cron";
import { env } from "../config/env";
import { metricsService } from "../services/metricsService";
import { retentionService } from "../services/retentionService";
import { backupService } from "../services/backupService";

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

export const startBackupJob = () => {
  if (!env.backupKey) {
    console.warn("BACKUP_ENCRYPTION_KEY não definido; backup diário desativado.");
    return;
  }
  if (!cron.validate(env.backupCron)) {
    console.warn(`Cron de backup inválido (${env.backupCron}); job desativado.`);
    return;
  }

  cron.schedule(env.backupCron, async () => {
    try {
      const { file, offsite } = await backupService.create();
      console.log(`Backup criado: ${file}${offsite ? "" : " (sem cópia fora do servidor)"}.`);
    } catch (error) {
      console.error("FALHA NO BACKUP DIÁRIO.", error);
    }
  });
};
