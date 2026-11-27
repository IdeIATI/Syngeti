export type ThemeId = "dark" | "tokyo-night" | "system" | "dlamb";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  isDark: boolean;
  previewPrimary: string;
  colors: {
    bgApp: string;
    bgSidebar: string;
    bgHeader: string;
    surface1: string;
    surface2: string;
    surface3: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryStrong: string;
    primaryHover: string;
    primarySoft: string;
    primaryForeground: string;
    secondary: string;
    accent?: string;
    link: string;
  };
}
