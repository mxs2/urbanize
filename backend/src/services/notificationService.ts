import { DemandStatus } from "../generated/prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

/** API pública do Expo Push. Não precisa de chave para projetos sem "enhanced security". */
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_TOKEN_PATTERN = /^(Exponent|Expo)PushToken\[[^\]]+\]$/;

const statusLabel: Record<DemandStatus, string> = {
  registrada: "registrada",
  em_analise: "em análise",
  encaminhada: "encaminhada ao órgão responsável",
  em_atendimento: "em atendimento",
  resolvida: "resolvida",
  cancelada: "cancelada",
};

interface ExpoPushTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

export const isExpoPushToken = (token: string) => EXPO_TOKEN_PATTERN.test(token);

type PushSender = (messages: object[]) => Promise<ExpoPushTicket[]>;

const sendToExpo: PushSender = async (messages) => {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  if (!response.ok) throw new Error(`Expo Push respondeu HTTP ${response.status}`);
  const body = (await response.json()) as { data?: ExpoPushTicket[] };
  return body.data ?? [];
};

let sender: PushSender = sendToExpo;

export const notificationService = {
  async registerToken(userId: string, token: string, platform?: string) {
    // O mesmo aparelho pode trocar de conta: o token passa a ser do usuário atual.
    return prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { token, userId, platform },
    });
  },

  async removeToken(userId: string, token: string) {
    await prisma.pushToken.deleteMany({ where: { token, userId } });
  },

  /**
   * Avisa o autor da demanda que o status mudou. Falha no envio não pode derrubar
   * a atualização de status, então os erros só vão para o log.
   */
  async notifyStatusChange(demand: {
    id: string;
    protocolo: string;
    titulo: string;
    status: DemandStatus;
    userId: string | null;
  }) {
    if (!env.pushNotificationsEnabled || !demand.userId) return;

    const tokens = await prisma.pushToken.findMany({ where: { userId: demand.userId } });
    if (tokens.length === 0) return;

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: "default",
      title: `Demanda ${demand.protocolo} ${statusLabel[demand.status]}`,
      body: demand.titulo,
      data: { demandId: demand.id, status: demand.status },
      channelId: "demandas",
    }));

    try {
      const tickets = await sender(messages);
      // Aparelho desinstalou o app ou revogou a permissão: o token não serve mais.
      const stale = tickets
        .map((ticket, index) => (ticket.details?.error === "DeviceNotRegistered" ? tokens[index]?.token : null))
        .filter((token): token is string => !!token);
      if (stale.length) await prisma.pushToken.deleteMany({ where: { token: { in: stale } } });
    } catch (error) {
      console.error("Falha ao enviar notificação push:", error);
    }
  },

  /** Apenas para testes: troca o envio real ao Expo por um dublê. */
  setSenderForTests(next: PushSender | null) {
    sender = next ?? sendToExpo;
  },
};
