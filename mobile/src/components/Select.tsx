import { Pressable, ScrollView, Text, View } from "react-native";
import { cx } from "@/utils/cx";

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  value: string;
  testID?: string;
  options: Option[];
  onChange: (value: string) => void;
}

/** Escolha única em chips roláveis; funciona igual em toque, mouse e leitor de tela. */
export function Select({ label, value, options, onChange, testID }: SelectProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[13px] font-semibold text-ink">{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2" role="radiogroup">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              testID={testID ? `${testID}-${option.value || "todos"}` : undefined}
              role="radio"
              aria-checked={active}
              onPress={() => onChange(option.value)}
              className={cx(
                "rounded-full border px-3.5 py-2",
                active ? "border-brand-500 bg-brand-500" : "border-line bg-surface active:bg-brand-50"
              )}
            >
              <Text className={cx("text-[13px]", active ? "font-semibold text-white" : "text-ink")}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
