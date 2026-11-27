import type { ThemeDefinition } from "./types";

export const tokyoNightTheme: ThemeDefinition = {
  id: "tokyo-night",
  label: "Tokyo Night",
  description: "Índigo/violeta profundo com contraponto em ciano",
  isDark: true,
  previewPrimary: "#7344B7",
  colors: {
    bgApp: "#0D0B22",
    bgSidebar: "#100F26",
    bgHeader: "#0D0B22",
    surface1: "#161534",
    surface2: "#1B1639",
    surface3: "#202543",
    border: "#565974",
    textPrimary: "#F4F3FF",
    textSecondary: "#B8B7D1",
    textMuted: "#8585A3",
    primary: "#7344B7",
    primaryStrong: "#4725AA",
    primaryHover: "#4725AA",
    primarySoft: "rgba(115, 68, 183, 0.20)",
    primaryForeground: "#F4F3FF",
    secondary: "#01C6B0",
    accent: "#2A81C3",
    link: "#01C6B0",
  },
};
