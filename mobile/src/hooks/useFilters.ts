import { useState } from "react";
import { FilterState } from "@/types/demand";

export const useFilters = (initial: FilterState = {}) => {
  const [filters, setFilters] = useState<FilterState>(initial);
  return { filters, setFilters };
};
