import fs from "fs/promises";
import path from "path";
import { Demand, Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { UPLOAD_DIR } from "../middlewares/uploadAccessMiddleware";
import { isSafeUploadFilename } from "../utils/signedUpload";

export const ANONIMO = "Anônimo";
export const EMAIL_ANONIMO = "anonimo@urbanize.invalid";

/**
 * RS13: troca os dados de contato por valores neutros. Bairro, categoria e status ficam
 * para as métricas. `updatedAt` é preservado porque entra no tempo médio de atendimento.
 */
export const anonymizeContact = async (
  tx: Prisma.TransactionClient,
  demand: Pick<Demand, "id" | "updatedAt">,
  extra: Prisma.DemandUpdateInput = {}
) => {
  await tx.demand.update({
    where: { id: demand.id },
    data: {
      ...extra,
      nomeSolicitante: ANONIMO,
      emailSolicitante: EMAIL_ANONIMO,
      telefoneSolicitante: null,
      updatedAt: demand.updatedAt,
    },
  });
  // A entrada "registrada" é a única escrita em nome do cidadão.
  await tx.demandHistory.updateMany({
    where: { demandId: demand.id, status: "registrada" },
    data: { autor: ANONIMO },
  });
};

/** Apaga do disco as fotos que nenhuma demanda referencia mais. */
export const removeOrphanPhotos = async (stored: string[]) => {
  for (const url of new Set(stored)) {
    const filename = url.replace(/^\/uploads\//, "");
    if (!url.startsWith("/uploads/") || !isSafeUploadFilename(filename)) continue;
    if (await prisma.demand.count({ where: { imagemUrl: url } })) continue;
    try {
      await fs.unlink(path.join(UPLOAD_DIR, filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("Falha ao apagar foto.", error);
    }
  }
};
