import { useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "@/theme";
import { cx } from "@/utils/cx";

interface TextFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function TextField({ label, required, error, hint, testID, multiline, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[13px] font-semibold text-ink">
        {label}
        {required ? <Text className="text-danger"> *</Text> : null}
      </Text>
      <TextInput
        testID={testID}
        aria-label={label}
        aria-invalid={!!error}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={cx(
          "rounded-md border bg-surface px-3 py-3 text-[15px] text-ink",
          multiline && "min-h-24",
          error ? "border-danger" : focused ? "border-brand-500" : "border-line"
        )}
        style={multiline ? { textAlignVertical: "top" } : undefined}
        {...inputProps}
      />
      {error ? (
        <Text testID={testID ? `${testID}-erro` : undefined} className="mt-1 text-xs text-danger">
          {error}
        </Text>
      ) : hint ? (
        <Text className="mt-1 text-xs text-ink-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
