import { ImageAnnotatorClient } from "@google-cloud/vision";
import { DemandCategory } from "../generated/prisma/client";
import { env } from "../config/env";

// Mapeamento de labels retornados pelo Vision API para categorias do sistema
const LABEL_MAP: { keywords: string[]; categoria: DemandCategory }[] = [
  {
    keywords: [
      "pothole",
      "sinkhole",
      "hole",
      "road",
      "asphalt",
      "crack",
      "pavement",
      "street",
      "highway",
      "sidewalk",
      "calçada",
      "buraco",
      "cratera",
      "asfalto",
    ],
    categoria: "vias_publicas",
  },
  {
    keywords: [
      "light",
      "lamp",
      "lantern",
      "street light",
      "lamppost",
      "utility pole",
      "telephone pole",
      "electric pole",
      "power line",
      "power cable",
      "electrical wire",
      "wire",
      "cable",
      "fallen wire",
      "fallen pole",
      "poste",
      "fiação",
      "fio",
      "cabo",
      "energia",
      "iluminação",
      "electricity",
    ],
    categoria: "iluminacao_publica",
  },
  {
    keywords: [
      "garbage",
      "trash",
      "waste",
      "litter",
      "dump",
      "rubbish",
      "debris",
      "lixo",
      "entulho",
      "acumulado",
      "recycling",
    ],
    categoria: "coleta_de_lixo",
  },
  {
    keywords: ["flood", "sewage", "pipe", "drain", "water", "esgoto", "alagamento", "água", "vazamento"],
    categoria: "saneamento",
  },
  {
    keywords: ["graffiti", "vandalism", "broken", "damaged", "destruction", "pichação", "vandalismo"],
    categoria: "fiscalizacao",
  },
  {
    keywords: [
      "park",
      "tree",
      "vegetation",
      "garden",
      "grass",
      "praça",
      "árvore",
      "jardim",
      "mato",
      "overgrown",
    ],
    categoria: "zeladoria",
  },
];

const classifyLabels = (labels: string[]): { categoria: DemandCategory; score: number } => {
  const lower = labels.map((l) => l.toLowerCase());

  for (const entry of LABEL_MAP) {
    const matched = entry.keywords.filter((kw) => lower.some((l) => l.includes(kw)));
    if (matched.length > 0) {
      return { categoria: entry.categoria, score: Math.min(0.6 + matched.length * 0.1, 0.98) };
    }
  }

  return { categoria: "outros", score: 0.45 };
};

let clientInstance: ImageAnnotatorClient | null = null;

const getClient = (): ImageAnnotatorClient | null => {
  if (!env.googleCredentials) return null;
  if (!clientInstance) {
    clientInstance = new ImageAnnotatorClient({
      credentials: JSON.parse(env.googleCredentials),
    });
  }
  return clientInstance;
};

export const visionService = {
  async triarImagem(
    filePath: string,
    clientCategoria?: DemandCategory
  ): Promise<{
    categoria: DemandCategory;
    score: number;
    labels: string[];
  }> {
    const client = getClient();

    // Se Vision API não estiver configurado, usa categoria classificada pelo TF.js no browser
    if (!client) {
      return {
        categoria: clientCategoria ?? "outros",
        score: clientCategoria ? 0.75 : 0.5,
        labels: [],
      };
    }

    const [result] = await client.labelDetection(filePath);
    const labels = (result.labelAnnotations ?? []).map((a) => a.description ?? "").filter(Boolean);

    const classified = classifyLabels(labels);
    return { ...classified, labels };
  },
};
