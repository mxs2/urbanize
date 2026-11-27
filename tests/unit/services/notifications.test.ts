import * as Notifications from "expo-notifications";
import { notifications } from "@/services/notifications";
import { Demand } from "@/types/demand";

const demanda = { id: "d1", protocolo: "URB-12345", titulo: "Poste apagado", status: "resolvida" } as Demand;

describe("Notificações de status", () => {
  beforeEach(() => jest.clearAllMocks());

  it("TC-NOT-01: dispara notificação local com o novo status e o id da demanda", async () => {
    await notifications.notifyStatusChanges([demanda]);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Demanda URB-12345: Resolvida",
          body: "Poste apagado",
          data: { demandId: "d1" },
        }),
      })
    );
  });

  it("não notifica quando nada mudou", async () => {
    await notifications.notifyStatusChanges([]);

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
