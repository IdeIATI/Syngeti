import type { ThemeDefinition } from "./types";
import { BRAND_COLORS } from "../tokens/colors";

export const dlambTheme: ThemeDefinition = {
  id: "dlamb",
  label: "D’Lamb",
  description: "Personalização institucional D’Lamb Sport",
  isDark: false,
  previewPrimary: BRAND_COLORS.dlambRed,
  colors: {
    bgApp: "#F4F5F6",
    bgSidebar: "#ECEEF0",
    bgHeader: "#FFFFFF",
    surface1: "#FFFFFF",
    surface2: "#F1F2F4",
    surface3: "#E4E5E7",
    border: "#D1D3D5",
    textPrimary: "#16171B",
    textSecondary: "#55575C",
    textMuted: BRAND_COLORS.dlambGray,
    primary: BRAND_COLORS.dlambRed,
    primaryStrong: "#6F1715",
    primaryHover: "#971F1B",
    primarySoft: "rgba(130, 31, 27, 0.10)",
    primaryForeground: "#FFFFFF",
    secondary: BRAND_COLORS.dlambGray,
    link: BRAND_COLORS.dlambRed,
  },
};
