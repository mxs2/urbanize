import { Router } from "express";
import { demandController } from "../controllers/demandController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

export const demandRoutes = Router();

demandRoutes.use(requireAuth);
demandRoutes.get("/", demandController.list);
demandRoutes.post("/", demandController.create);
demandRoutes.get("/:id", demandController.getById);
demandRoutes.patch(
  "/:id/status",
  requireRole(["gestor"], "Somente gestores podem alterar status."),
  demandController.updateStatus
);
