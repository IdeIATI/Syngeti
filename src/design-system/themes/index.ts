import { darkTheme } from "./dark";
import { tokyoNightTheme } from "./tokyoNight";
import { systemTheme } from "./system";
import { dlambTheme } from "./dlamb";
import type { ThemeDefinition, ThemeId } from "./types";

export type { ThemeDefinition, ThemeId } from "./types";
export { darkTheme, tokyoNightTheme, systemTheme, dlambTheme };

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  dark: darkTheme,
  "tokyo-night": tokyoNightTheme,
  system: systemTheme,
  dlamb: dlambTheme,
};

export const THEME_LIST: ThemeDefinition[] = [
  darkTheme,
  tokyoNightTheme,
  systemTheme,
  dlambTheme,
];

export const VALID_THEME_IDS: ThemeId[] = ["dark", "tokyo-night", "system", "dlamb"];

export function normalizeTheme(value?: string | null): ThemeId | null {
  if (!value) return null;
  if (value === "light") return "system";
  if (VALID_THEME_IDS.includes(value as ThemeId)) {
    return value as ThemeId;
  }
  return null;
}
