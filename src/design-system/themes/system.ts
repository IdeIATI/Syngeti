import type { ThemeDefinition } from "./types";

export const systemTheme: ThemeDefinition = {
  id: "system",
  label: "Sistema",
  description: "Tema claro corporativo de alta legibilidade",
  isDark: false,
  previewPrimary: "#1392CE",
  colors: {
    bgApp: "#EFF5F9",
    bgSidebar: "#F4F8FB",
    bgHeader: "#FFFFFF",
    surface1: "#FFFFFF",
    surface2: "#EFF2F5",
    surface3: "#E9EDF1",
    border: "#B9D2DA",
    textPrimary: "#2F2B34",
    textSecondary: "#596574",
    textMuted: "#838B99",
    primary: "#1392CE",
    primaryStrong: "#05ABC4",
    primaryHover: "#05ABC4",
    primarySoft: "rgba(19, 146, 206, 0.12)",
    primaryForeground: "#FFFFFF",
    secondary: "#05ABC4",
    accent: "#37DFDC",
    link: "#1392CE",
  },
};
