/**
 * Tokens de design. Em CommonJS porque o tailwind.config.js também lê este arquivo:
 * as classes do NativeWind (bg-brand-500, text-ink-muted...) e os valores usados em
 * props que não aceitam className (cor de ActivityIndicator, ícones) saem da mesma fonte.
 */
const colors = {
  brand: {
    50: "#e6f1ff",
    100: "#c0dbfd",
    200: "#96c3fb",
    300: "#6aabf8",
    400: "#4a97f0",
    500: "#2b82d4",
    600: "#1f68ac",
    700: "#164e84",
    800: "#0f375f",
    900: "#0c2c48",
  },
  success: "#1f9e64",
  warning: "#e8a23a",
  danger: "#d64545",
  text: "#0f1720",
  textMuted: "#5b6472",
  border: "#e2e8f0",
  surface: "#ffffff",
  background: "#f5f7fa",
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
const radii = { sm: 8, md: 12, lg: 16 };
const fontSizes = { xs: 12, sm: 14, md: 16, lg: 20, xl: 26 };

module.exports = { colors, spacing, radii, fontSizes };
