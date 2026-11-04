jest.mock("@/services/demandService", () => ({
  demandService: { getAll: jest.fn() },
}));

import { demandService } from "@/services/demandService";
import { useDemandStore } from "@/store/demandStore";

const mockGetAll = demandService.getAll as jest.Mock;

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
});
