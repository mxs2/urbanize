import { Request, Response } from "express";
import { z } from "zod";
import { DemandCategory, DemandPriority, DemandSource, DemandStatus } from "../generated/prisma/client";
import { demandService } from "../services/demandService";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

const demandFiltersSchema = z.object({
  status: z.enum(DemandStatus).optional(),
  categoria: z.enum(DemandCategory).optional(),
  prioridade: z.enum(DemandPriority).optional(),
  bairro: z.string().optional(),
  busca: z.string().optional(),
});

const createDemandSchema = z.object({
  titulo: z.string().min(3),
  descricao: z.string().min(5),
  categoria: z.enum(DemandCategory),
  prioridade: z.enum(DemandPriority).optional(),
  nomeSolicitante: z.string().optional(),
  emailSolicitante: z.string().email().optional(),
  telefoneSolicitante: z.string().optional(),
  endereco: z.object({
    endereco: z.string().min(3),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    referencia: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  origem: z.enum(DemandSource).optional(),
  imagemUrl: z.string().min(1).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(DemandStatus),
  observacaoGestor: z.string().optional(),
});

const updateDemandSchema = z
  .object({
    titulo: z.string().min(3),
    descricao: z.string().min(5),
    categoria: z.enum(DemandCategory),
    prioridade: z.enum(DemandPriority),
    telefoneSolicitante: z.string(),
    endereco: z
      .object({
        endereco: z.string().min(3),
        bairro: z.string(),
        cidade: z.string(),
        referencia: z.string(),
        latitude: z.number(),
        longitude: z.number(),
      })
      .partial(),
    imagemUrl: z.string().min(1),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Informe ao menos um campo para atualizar." });

const getUser =(req: Request) => {
  if (!req.user) throw new AppError("Sessão não autenticada.", 401, "UNAUTHENTICATED");
  return req.user;
};

export const demandController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const filters = demandFiltersSchema.parse(req.query);
    const data = await demandService.list(filters, getUser(req));
    res.json({ success: true, data });
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await demandService.getById(String(req.params.id), getUser(req));
    res.json({ success: true, data });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const payload = createDemandSchema.parse(req.body);
    const data = await demandService.create(payload, getUser(req));
    res.status(201).json({ success: true, data });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const payload = updateDemandSchema.parse(req.body);
    const data = await demandService.update(String(req.params.id), payload, getUser(req));
    res.json({ success: true, data });
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await demandService.remove(String(req.params.id), getUser(req));
    res.json({ success: true, data: null });
  }),
  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const payload = updateStatusSchema.parse(req.body);
    const data = await demandService.updateStatus(String(req.params.id), payload, getUser(req));
    res.json({ success: true, data });
  }),
};
