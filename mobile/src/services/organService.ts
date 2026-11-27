import { api } from "./api";
import { DemandCategory } from "@/types/demand";
import { Organ } from "@/types/organ";

export const organService = {
  list: (): Promise<Organ[]> => api.getOrgans(),
  /** Primeiro órgão que declara atender a categoria. */
  findByCategory: (organs: Organ[], categoria: DemandCategory) =>
    organs.find((organ) => (JSON.parse(organ.categoriasJson) as DemandCategory[]).includes(categoria)),
};
