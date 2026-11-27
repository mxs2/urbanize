/** Junta classes do NativeWind ignorando valores falsos: cx("p-4", active && "bg-brand-500"). */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
