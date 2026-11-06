import { Router } from "express";
import { demandController } from "../controllers/demandController";
import { requireAuth } from "../middlewares/authMiddleware";

export const demandRoutes = Router();

demandRoutes.use(requireAuth);
demandRoutes.get("/", demandController.list);
demandRoutes.post("/", demandController.create);
demandRoutes.get("/:id", demandController.getById);
demandRoutes.patch("/:id", demandController.update);
demandRoutes.delete("/:id", demandController.remove);
demandRoutes.patch("/:id/status", demandController.updateStatus);
