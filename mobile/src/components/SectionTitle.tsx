import { ReactNode } from "react";
import { Text, View } from "react-native";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  /** Ação à direita do título (ex.: "Ver todas"). */
  action?: ReactNode;
}

export function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <View className="mb-3 mt-2 flex-row items-end justify-between gap-3">
      <View className="flex-1">
        <Text role="heading" className="text-lg font-bold text-ink">
          {title}
        </Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-ink-muted">{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}
