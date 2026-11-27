import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/appError";

export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Rota ${req.method} ${req.originalUrl} não encontrada.`, 404, "NOT_FOUND"));
};

export const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: error.issues,
      },
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Erros do parser do corpo (JSON malformado, tamanho excedido) trazem o corpo recebido,
  // que pode ter senha. São erro do cliente: respondem 4xx e não vão para o log.
  const { type, status } = (error ?? {}) as { type?: unknown; status?: unknown };
  if (typeof type === "string" && typeof status === "number" && status >= 400 && status < 500) {
    return res.status(status).json({
      success: false,
      error: { code: "INVALID_BODY", message: "Corpo da requisição inválido." },
    });
  }

  // Só a pilha: o objeto inteiro pode carregar dados da requisição.
  console.error(error instanceof Error ? error.stack : "Erro não identificado.");
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno no servidor.",
    },
  });
};
