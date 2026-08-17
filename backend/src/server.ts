import { app } from "./app";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import { startMetricsJob } from "./config/cron";

const start = async () => {
  await connectRedis();
  startMetricsJob();

  app.listen(env.port, env.host, () => {
    console.log(`Backend Urbanize escutando em http://${env.host}:${env.port}/api`);
  });
};

start().catch((error) => {
  console.error("Falha ao iniciar backend.", error);
  process.exit(1);
});
