import { Text, View } from "react-native";
import { DemandHistoryItem } from "@/types/demand";
import { formatDate } from "@/utils/formatDate";
import { statusColor, statusLabel } from "@/utils/statusLabel";

export function DemandTimeline({ historico }: { historico: DemandHistoryItem[] }) {
  return (
    <View>
      {historico.map((item, index) => {
        const last = index === historico.length - 1;
        return (
          <View key={item.id} className="flex-row gap-3">
            <View className="items-center">
              <View className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: statusColor[item.status] }} />
              {!last ? <View className="w-0.5 flex-1 bg-line" /> : null}
            </View>
            <View className="flex-1 gap-0.5 pb-5">
              <Text className="text-sm font-semibold" style={{ color: statusColor[item.status] }}>
                {statusLabel[item.status]}
              </Text>
              <Text className="text-[13px] text-ink">{item.descricao.replace(/\s*\|\s*Contatos:.*$/i, "")}</Text>
              <Text className="text-[11px] text-ink-muted">
                {formatDate(item.data)} · {item.autor}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
