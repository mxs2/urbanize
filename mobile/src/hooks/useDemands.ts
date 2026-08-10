import { useEffect } from "react";
import { useDemandStore } from "@/store/demandStore";

export const useDemands = (auto = true) => {
  const store = useDemandStore();
  useEffect(() => {
    if (auto) store.fetchDemands(store.filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);
  return store;
};
