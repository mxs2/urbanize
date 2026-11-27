import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDemandStore } from "@/store/demandStore";
import { DemandCategory, DemandPriority, DemandStatus, FilterState } from "@/types/demand";
import { categoryLabel } from "@/utils/categoryLabel";
import { priorityLabel } from "@/utils/priorityLabel";
import { statusLabel } from "@/utils/statusLabel";
import { colors } from "@/theme";
import { Button } from "./Button";
import { Select } from "./Select";
import { TextField } from "./TextField";

const withAll = (label: string, entries: Record<string, string>) => [
  { label, value: "" },
  ...Object.entries(entries).map(([value, text]) => ({ value, label: text })),
];

const statusOptions = withAll("Todos", statusLabel);
const categoryOptions = withAll("Todas", categoryLabel);
const priorityOptions = withAll("Todas", priorityLabel);

const activeCount = ({ status, categoria, bairro, prioridade }: FilterState) =>
  [status, categoria, bairro, prioridade].filter(Boolean).length;

/** Busca sempre visível; status, categoria, bairro e prioridade num painel recolhível. */
export function DemandFilters() {
  const { filters, setFilters, fetchDemands, clearFilters, bairros } = useDemandStore();
  const [open, setOpen] = useState(false);
  const count = activeCount(filters);

  const bairroOptions = [{ label: "Todos", value: "" }, ...bairros.map((bairro) => ({ label: bairro, value: bairro }))];

  return (
    <View className="mb-2">
      <TextField
        testID="input-busca"
        label="Buscar"
        placeholder="Título, descrição ou protocolo"
        returnKeyType="search"
        value={filters.busca ?? ""}
        onChangeText={(busca) => setFilters({ ...filters, busca })}
        onSubmitEditing={() => fetchDemands(filters)}
      />

      <View className="mb-3 flex-row gap-2">
        <Pressable
          testID="btn-filtros"
          role="button"
          aria-expanded={open}
          onPress={() => setOpen(!open)}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-md border border-line bg-surface px-3 py-3 active:bg-brand-50"
        >
          <Ionicons name="options-outline" size={18} color={colors.brand[600]} />
          <Text className="text-[15px] font-semibold text-brand-600">
            Filtros{count ? ` (${count})` : ""}
          </Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
        </Pressable>
        <Button
          className="flex-1"
          testID="btn-aplicar-filtros"
          label="Aplicar filtros"
          icon="search"
          onPress={() => fetchDemands(filters)}
        />
      </View>

      {open ? (
        <View className="mb-3 rounded-lg border border-line bg-surface p-4 pb-0">
          <Select
            testID="filtro-status"
            label="Status"
            value={filters.status ?? ""}
            options={statusOptions}
            onChange={(value) => setFilters({ ...filters, status: (value || undefined) as DemandStatus | undefined })}
          />
          <Select
            testID="filtro-categoria"
            label="Categoria"
            value={filters.categoria ?? ""}
            options={categoryOptions}
            onChange={(value) =>
              setFilters({ ...filters, categoria: (value || undefined) as DemandCategory | undefined })
            }
          />
          <Select
            testID="filtro-bairro"
            label="Bairro"
            value={filters.bairro ?? ""}
            options={bairroOptions}
            onChange={(value) => setFilters({ ...filters, bairro: value || undefined })}
          />
          <Select
            testID="filtro-prioridade"
            label="Prioridade"
            value={filters.prioridade ?? ""}
            options={priorityOptions}
            onChange={(value) =>
              setFilters({ ...filters, prioridade: (value || undefined) as DemandPriority | undefined })
            }
          />
          {count ? (
            <Button
              className="mb-4"
              testID="btn-limpar-filtros"
              label="Limpar filtros"
              variant="ghost"
              size="sm"
              onPress={() => {
                clearFilters();
                fetchDemands({ busca: filters.busca });
              }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
