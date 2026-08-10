import { Address } from "@/types/demand";

export const formatLocation = (address: Address) =>
  `${address.endereco} - ${address.bairro}, ${address.cidade}`;
