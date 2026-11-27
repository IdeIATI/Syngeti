"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { THEMES, THEME_LIST, normalizeTheme, type ThemeDefinition, type ThemeId } from "../themes";

export const THEME_STORAGE_KEY = "syngeti-theme";
export const LEGACY_THEME_STORAGE_KEY = "theme";

export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k)||localStorage.getItem('${LEGACY_THEME_STORAGE_KEY}');var t=s==='light'?'system':(s==='dark'||s==='tokyo-night'||s==='system'||s==='dlamb'?s:null);if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'system';}var d=t==='dark'||t==='tokyo-night';var r=document.documentElement;r.setAttribute('data-theme',t);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themeConfig: ThemeDefinition;
  isDark: boolean;
  mounted: boolean;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  themeConfig: THEMES.dark,
  isDark: true,
  mounted: false,
  themes: THEME_LIST,
});

function applyThemeToDocument(themeId: ThemeId, disableTransition = false) {
  if (typeof document === "undefined") return;

  let styleEl: HTMLStyleElement | null = null;
  if (disableTransition && document.head) {
    styleEl = document.createElement("style");
    styleEl.appendChild(
      document.createTextNode(
        "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
      )
    );
    document.head.appendChild(styleEl);
  }

  const root = document.documentElement;
  const isDark = THEMES[themeId].isDark;
  root.setAttribute("data-theme", themeId);
  root.style.colorScheme = isDark ? "dark" : "light";

  if (styleEl) {
    // Força reflow para aplicar os tokens instantaneamente sem interpolação intermediária
    void window.getComputedStyle(document.body).opacity;
    requestAnimationFrame(() => {
      styleEl?.remove();
    });
  }
}

function getInitialClientTheme(): ThemeId {
  if (typeof window === "undefined") return "dark";

  const attrTheme = normalizeTheme(document.documentElement.getAttribute("data-theme"));
  if (attrTheme) return attrTheme;

  try {
    const stored =
      normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY)) ||
      normalizeTheme(localStorage.getItem(LEGACY_THEME_STORAGE_KEY));
    if (stored) return stored;
  } catch {}

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialClientTheme();
    setThemeState(initial);
    applyThemeToDocument(initial);
    setMounted(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY || e.key === LEGACY_THEME_STORAGE_KEY) {
        const next = normalizeTheme(e.newValue);
        if (next) {
          setThemeState(next);
          applyThemeToDocument(next);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeId) => {
    const normalized = normalizeTheme(nextTheme) || "dark";
    setThemeState(normalized);
    applyThemeToDocument(normalized, true);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
      localStorage.setItem(LEGACY_THEME_STORAGE_KEY, normalized);
    } catch {}
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const themeConfig = THEMES[theme] || THEMES.dark;
    return {
      theme,
      setTheme,
      themeConfig,
      isDark: themeConfig.isDark,
      mounted,
      themes: THEME_LIST,
    };
  }, [theme, setTheme, mounted]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
