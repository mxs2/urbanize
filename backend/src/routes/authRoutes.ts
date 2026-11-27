import { Router } from "express";
import { authController } from "../controllers/authController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";
import { loginAccountLimiter, loginIpLimiter, passwordConfirmLimiter, registerLimiter } from "../middlewares/rateLimitMiddleware";

export const authRoutes = Router();

authRoutes.post("/register", registerLimiter, authController.register);
authRoutes.post("/login", loginIpLimiter, loginAccountLimiter, authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.get("/me", requireAuth, authController.me);
// Direitos do titular (LGPD, art. 18): sempre sobre a própria conta, nunca por id.
authRoutes.patch("/me", requireAuth, passwordConfirmLimiter, authController.updateMe);
authRoutes.delete("/me", requireAuth, passwordConfirmLimiter, authController.deleteMe);
authRoutes.get("/me/dados", requireAuth, authController.exportMe);
authRoutes.post("/logout", authController.logout);
authRoutes.post("/gestores", requireAuth, requireRole(["gestor"]), authController.promoteGestor);
authRoutes.delete("/gestores", requireAuth, requireRole(["gestor"]), authController.demoteGestor);
