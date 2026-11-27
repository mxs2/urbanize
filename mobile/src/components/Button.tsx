import { ComponentProps } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { cx } from "@/utils/cx";

type Variant = "solid" | "outline" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>["name"];
  size?: "md" | "sm";
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  className?: string;
}

const container: Record<Variant, string> = {
  solid: "bg-brand-500 active:bg-brand-600",
  outline: "border border-brand-500 bg-surface active:bg-brand-50",
  ghost: "bg-transparent active:bg-brand-50",
  danger: "bg-danger active:opacity-90",
};

const text: Record<Variant, string> = {
  solid: "text-white",
  outline: "text-brand-600",
  ghost: "text-brand-600",
  danger: "text-white",
};

const iconColor = (variant: Variant) => (variant === "solid" || variant === "danger" ? "#fff" : colors.brand[600]);

export function Button({
  label,
  onPress,
  variant = "solid",
  icon,
  size = "md",
  disabled,
  loading,
  testID,
  className,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      role="button"
      aria-disabled={isDisabled}
      className={cx(
        "flex-row items-center justify-center rounded-md",
        size === "md" ? "min-h-12 px-4 py-3" : "min-h-9 px-3 py-2",
        container[variant],
        isDisabled && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={iconColor(variant)} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={size === "md" ? 18 : 15} color={iconColor(variant)} /> : null}
          <Text className={cx("font-semibold", size === "md" ? "text-[15px]" : "text-[13px]", text[variant])}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
