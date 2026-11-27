import AsyncStorage from "@react-native-async-storage/async-storage";
import { demandCache } from "@/services/demandCache";
import { Demand } from "@/types/demand";

const demand = (id: string, overrides: Partial<Demand> = {}): Demand => ({
  id,
  protocolo: `URB-${id}`,
  titulo: `Demanda ${id}`,
  descricao: "Descrição",
  categoria: "vias_publicas",
  prioridade: "media",
  status: "em_analise",
  nomeSolicitante: "Cidadão",
  emailSolicitante: "cidadao@urbanize.com",
  endereco: { endereco: "Rua A", bairro: "Boa Vista", cidade: "Recife" },
  origem: "cidadao",
  criadaEm: `2026-11-0${id}T10:00:00.000Z`,
  atualizadaEm: `2026-11-0${id}T10:00:00.000Z`,
  historico: [],
  ...overrides,
});

describe("Cache local de demandas", () => {
  beforeEach(() => AsyncStorage.clear());

  it("junta listas filtradas e devolve da mais nova para a mais antiga", async () => {
    await demandCache.save("u1", [demand("1")]);
    await demandCache.save("u1", [demand("2", { status: "resolvida" })]);

    const cached = await demandCache.list("u1");

    expect(cached?.demands.map((d) => d.id)).toEqual(["2", "1"]);
  });

  it("aplica os filtros da API sobre o cache quando está offline", async () => {
    await demandCache.save("u1", [
      demand("1", { status: "resolvida" }),
      demand("2", { endereco: { endereco: "Rua B", bairro: "Derby", cidade: "Recife" } }),
    ]);

    expect((await demandCache.list("u1", { status: "resolvida" }))?.demands.map((d) => d.id)).toEqual(["1"]);
    expect((await demandCache.list("u1", { bairro: "Derby" }))?.demands.map((d) => d.id)).toEqual(["2"]);
    expect((await demandCache.list("u1", { busca: "urb-2" }))?.demands.map((d) => d.id)).toEqual(["2"]);
  });

  it("separa o cache por usuário e apaga no logout", async () => {
    await demandCache.save("u1", [demand("1")]);

    expect(await demandCache.list("u2")).toBeNull();
    expect((await demandCache.get("u1", "1"))?.demand.titulo).toBe("Demanda 1");

    await demandCache.clear("u1");
    expect(await demandCache.list("u1")).toBeNull();
  });
});
