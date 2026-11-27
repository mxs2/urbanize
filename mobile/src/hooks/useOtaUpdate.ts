import { useEffect } from "react";
import * as Updates from "expo-updates";

/**
 * Atualização OTA (expo-updates): ao abrir, o app consulta o canal do build no EAS Update
 * e baixa o bundle novo em segundo plano. Quando o download termina, `ready` fica true e
 * a UI oferece reiniciar; se o usuário não reiniciar, a versão nova entra na próxima abertura.
 *
 * Em desenvolvimento (Metro) e no Expo Go o módulo fica desativado e o hook não faz nada.
 */
export function useOtaUpdate() {
  const { isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    Updates.checkForUpdateAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isUpdateAvailable && !isUpdatePending && !isDownloading) {
      Updates.fetchUpdateAsync().catch(() => undefined);
    }
  }, [isUpdateAvailable, isUpdatePending, isDownloading]);

  return {
    ready: isUpdatePending,
    apply: () => Updates.reloadAsync(),
  };
}
