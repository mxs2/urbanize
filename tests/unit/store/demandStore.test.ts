jest.mock("@/services/demandService", () => ({
  demandService: { getAll: jest.fn(), getById: jest.fn(), updateStatus: jest.fn() },
}));

import { demandService } from "@/services/demandService";
import { useDemandStore } from "@/store/demandStore";

const mockGetAll = demandService.getAll as jest.Mock;
const mockGetById = demandService.getById as jest.Mock;
const mockUpdateStatus = demandService.updateStatus as jest.Mock;

describe("Demand Store", () => {
  it("TC65: Deve expor o estado de carregamento enquanto a listagem está pendente", async () => {
    let resolver: (value: unknown[]) => void = () => undefined;
    mockGetAll.mockReturnValue(new Promise((resolve) => (resolver = resolve)));

    // fetchDemands é o que o hook useDemands dispara ao montar.
    const pendente = useDemandStore.getState().fetchDemands();
    expect(useDemandStore.getState().loading).toBe(true);

    resolver([]);
    await pendente;
    expect(useDemandStore.getState().loading).toBe(false);
  });

  it("libera o estado de envio quando a mudança de status falha", async () => {
    mockUpdateStatus.mockRejectedValueOnce(new Error("Somente gestores podem alterar status."));

    await expect(useDemandStore.getState().updateDemandStatus("d1", "resolvida")).rejects.toThrow();

    expect(useDemandStore.getState().saving).toBe(false);
    expect(useDemandStore.getState().loading).toBe(false);
  });

  it("guarda a mensagem do backend quando o detalhe não carrega", async () => {
    mockGetById.mockRejectedValueOnce(new Error("Demanda não encontrada."));

    await useDemandStore.getState().fetchDemandById("inexistente");

    expect(useDemandStore.getState().error).toBe("Demanda não encontrada.");
    expect(useDemandStore.getState().selected).toBeUndefined();
  });
});
