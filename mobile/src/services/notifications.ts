import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";
import { useNoticeStore } from "@/store/noticeStore";
import { Demand } from "@/types/demand";
import { statusLabel } from "@/utils/statusLabel";

/**
 * Notificações de mudança de status (registrar → acompanhar → notificar).
 *
 * Dois caminhos:
 * - Push remoto: o app registra o token Expo no backend, que envia o push quando o gestor
 *   muda o status. Precisa de build (EAS ou dev client) com projectId e aparelho físico.
 * - Local: ao sincronizar, o app compara o status novo com o do cache e dispara uma
 *   notificação no próprio aparelho. Cobre Expo Go e emulador, onde não há push remoto.
 *   Na web, onde não há notificação do sistema, vira um aviso dentro do app.
 */
export const DEMANDS_CHANNEL_ID = "demandas";

const isNative = Platform.OS !== "web";

let pushToken: string | null = null;
let lastOpenedNotification: string | null = null;

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const projectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

const ensurePermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
};

const ensureAndroidChannel = () =>
  Platform.OS === "android"
    ? Notifications.setNotificationChannelAsync(DEMANDS_CHANNEL_ID, {
        name: "Atualizações das demandas",
        // O enum existe; o eslint-plugin-import não lê o export do build do SDK 58.
        // eslint-disable-next-line import/namespace
        importance: Notifications.AndroidImportance.HIGH,
      })
    : Promise.resolve(null);

export const notifications = {
  /** Pede permissão e, quando o build permite, registra o token de push no backend. */
  async register(): Promise<void> {
    if (!isNative) return;
    try {
      await ensureAndroidChannel();
      if (!(await ensurePermission())) return;

      const id = projectId();
      // Sem projectId (Expo Go, sem `eas init`) ou em emulador não há push remoto;
      // as notificações locais continuam funcionando.
      if (!id || !Device.isDevice) return;

      const { data } = await Notifications.getExpoPushTokenAsync({ projectId: id });
      await api.registerPushToken(data, Platform.OS);
      pushToken = data;
    } catch (error) {
      console.warn("Notificações push indisponíveis:", error);
    }
  },

  /** Chamado antes do logout, enquanto o token de sessão ainda vale. */
  async unregister(): Promise<void> {
    if (!pushToken) return;
    const token = pushToken;
    pushToken = null;
    await api.unregisterPushToken(token).catch(() => undefined);
  },

  /** Avisa o cidadão das demandas cujo status mudou desde a última sincronização. */
  async notifyStatusChanges(changed: Demand[]): Promise<void> {
    // Com push remoto ativo o backend já avisou; evitar notificação em dobro.
    if (changed.length === 0 || pushToken) return;

    for (const demand of changed) {
      const title = `Demanda ${demand.protocolo}: ${statusLabel[demand.status]}`;
      if (!isNative) {
        useNoticeStore.getState().show({ title, body: demand.titulo, demandId: demand.id });
        continue;
      }
      await Notifications.scheduleNotificationAsync({
        content: { title, body: demand.titulo, data: { demandId: demand.id }, sound: "default" },
        trigger: Platform.OS === "android" ? { channelId: DEMANDS_CHANNEL_ID } : null,
      }).catch(() => undefined);
    }
  },

  /** Toque numa notificação (com o app aberto ou não) leva ao detalhe da demanda. */
  onOpen(listener: (demandId: string) => void): () => void {
    if (!isNative) return () => undefined;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response || response.notification.request.identifier === lastOpenedNotification) return;
      lastOpenedNotification = response.notification.request.identifier;
      const demandId = response.notification.request.content.data?.demandId;
      if (typeof demandId === "string") listener(demandId);
    };
    open(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  },
};
