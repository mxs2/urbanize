const { colors, radii } = require("./src/theme/tokens");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // O app é só tema claro (userInterfaceStyle: light); "media" faz o NativeWind
  // lançar erro na web quando o navegador muda o esquema de cores.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        ink: { DEFAULT: colors.text, muted: colors.textMuted },
        line: colors.border,
        surface: colors.surface,
        canvas: colors.background,
      },
      borderRadius: {
        sm: `${radii.sm}px`,
        md: `${radii.md}px`,
        lg: `${radii.lg}px`,
      },
    },
  },
  plugins: [],
};
