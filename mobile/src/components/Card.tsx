import { ReactNode } from "react";
import { View } from "react-native";
import { cx } from "@/utils/cx";

/** Superfície branca com borda suave, base dos blocos de conteúdo. */
export function Card({ children, className, testID }: { children: ReactNode; className?: string; testID?: string }) {
  return (
    <View testID={testID} className={cx("rounded-lg border border-line bg-surface p-4", className)}>
      {children}
    </View>
  );
}
