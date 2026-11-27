import { Text, View } from "react-native";
import { DemandCategory } from "@/types/demand";
import { categoryLabel } from "@/utils/categoryLabel";

/**
 * Distribuição das demandas por categoria: barras horizontais ordenadas, um só matiz
 * (é uma série, a cor não codifica identidade). Valor e percentual ficam no texto,
 * então a leitura não depende da cor nem do comprimento da barra.
 */
export function CategoryBreakdown({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  const max = rows[0]?.[1] ?? 0;

  if (rows.length === 0) {
    return <Text className="text-sm text-ink-muted">Nenhuma demanda registrada.</Text>;
  }

  return (
    <View testID="grafico-categorias" className="gap-3">
      {rows.map(([categoria, value]) => {
        const label = categoryLabel[categoria as DemandCategory] ?? categoria;
        const percent = total ? Math.round((value / total) * 100) : 0;
        return (
          <View key={categoria} accessible aria-label={`${label}: ${value} demandas, ${percent}%`} className="gap-1">
            <View className="flex-row items-baseline justify-between">
              <Text className="flex-1 text-[13px] text-ink" numberOfLines={1}>
                {label}
              </Text>
              <Text className="text-[13px] font-semibold text-ink">
                {value} <Text className="font-normal text-ink-muted">· {percent}%</Text>
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-canvas">
              <View
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${max ? Math.max((value / max) * 100, 2) : 0}%` }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
