import { StyleSheet, View } from "react-native";
import { useDemandStore } from "@/store/demandStore";
import { DemandCategory, DemandPriority, DemandStatus } from "@/types/demand";
import { categoryLabel } from "@/utils/categoryLabel";
import { priorityLabel } from "@/utils/priorityLabel";
import { statusLabel } from "@/utils/statusLabel";
import { spacing } from "@/theme";
import { Button } from "./Button";
import { Select } from "./Select";
import { TextField } from "./TextField";

const statusOptions = [
  { label: "Todos", value: "" },
  ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
];
const categoryOptions = [
  { label: "Todas", value: "" },
  ...Object.entries(categoryLabel).map(([value, label]) => ({ value, label })),
];
const priorityOptions = [
  { label: "Todas", value: "" },
  ...Object.entries(priorityLabel).map(([value, label]) => ({ value, label })),
];

export function DemandFilters() {
  const { filters, setFilters, fetchDemands } = useDemandStore();

  return (
    <View style={styles.container}>
      <TextField
        label="Buscar"
        placeholder="Título, descrição ou protocolo"
        value={filters.busca ?? ""}
        onChangeText={(busca) => setFilters({ ...filters, busca })}
      />
      <Select
        label="Status"
        value={filters.status ?? ""}
        options={statusOptions}
        onChange={(value) =>
          setFilters({ ...filters, status: (value || undefined) as DemandStatus | undefined })
        }
      />
      <Select
        label="Categoria"
        value={filters.categoria ?? ""}
        options={categoryOptions}
        onChange={(value) =>
          setFilters({ ...filters, categoria: (value || undefined) as DemandCategory | undefined })
        }
      />
      <Select
        label="Prioridade"
        value={filters.prioridade ?? ""}
        options={priorityOptions}
        onChange={(value) =>
          setFilters({ ...filters, prioridade: (value || undefined) as DemandPriority | undefined })
        }
      />
      <Button label="Aplicar filtros" onPress={() => fetchDemands(filters)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
});
