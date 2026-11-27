import { Router } from "express";
import { authController } from "../controllers/authController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";
import { loginAccountLimiter, loginIpLimiter, registerLimiter } from "../middlewares/rateLimitMiddleware";

export const authRoutes = Router();

authRoutes.post("/register", registerLimiter, authController.register);
authRoutes.post("/login", loginIpLimiter, loginAccountLimiter, authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.get("/me", requireAuth, authController.me);
authRoutes.post("/logout", authController.logout);
authRoutes.post("/gestores", requireAuth, requireRole(["gestor"]), authController.promoteGestor);
