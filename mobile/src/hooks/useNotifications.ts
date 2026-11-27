import { useEffect } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import { notifications } from "@/services/notifications";
import { useDemandStore } from "@/store/demandStore";
import { User } from "@/types/user";

const SYNC_INTERVAL_MS = 30_000;

/**
 * Liga o fluxo de notificação para o usuário logado: registra o aparelho, abre a demanda
 * ao tocar na notificação e, para o cidadão, sincroniza periodicamente e ao voltar para
 * o app, o que dispara o aviso local quando o gestor mudou algum status.
 */
export function useNotifications(user: User | null) {
  const userId = user?.id;
  const isCidadao = user?.role === "cidadao";

  useEffect(() => {
    if (!userId) return;
    notifications.register();
    return notifications.onOpen((demandId) => router.push(`/demandas/${demandId}`));
  }, [userId]);

  useEffect(() => {
    if (!userId || !isCidadao) return;
    const sync = () => useDemandStore.getState().syncInBackground();
    const interval = setInterval(sync, SYNC_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [userId, isCidadao]);
}
