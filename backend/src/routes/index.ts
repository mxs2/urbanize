import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { demandRoutes } from "./demandRoutes";
import { metricsRoutes } from "./metricsRoutes";
import { uploadRoutes } from "./uploadRoutes";
import { organRoutes } from "./organRoutes";

export const routes = Router();

// Índice da API: abrir /api no navegador mostra o que está disponível em vez de um 404.
routes.get("/", (_req, res) =>
  res.json({
    success: true,
    data: {
      name: "Urbanize API",
      status: "ok",
      endpoints: {
        health: "/api/health",
        auth: "/api/auth",
        demands: "/api/demands",
        metrics: "/api/metrics",
        organs: "/api/organs",
        upload: "/api/upload",
      },
    },
  })
);

routes.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
routes.use("/auth", authRoutes);
routes.use("/demands", demandRoutes);
routes.use("/metrics", metricsRoutes);
routes.use("/upload", uploadRoutes);
routes.use("/organs", organRoutes);
