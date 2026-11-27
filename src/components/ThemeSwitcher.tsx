"use client";

import * as React from "react";
import { Monitor, Moon, Palette, Sparkles, Check } from "lucide-react";
import { useTheme } from "@/design-system/ThemeProvider";
import type { ThemeId } from "@/design-system/themes";

const THEME_ICONS: Record<ThemeId, React.ComponentType<{ size?: number; className?: string }>> = {
  dark: Moon,
  "tokyo-night": Sparkles,
  system: Monitor,
  dlamb: Palette,
};

export function ThemeSwitcher() {
  const { theme, setTheme, mounted, themes } = useTheme();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-xl bg-surface-2 animate-pulse" aria-hidden="true" />;
  }

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];
  const CurrentIcon = THEME_ICONS[currentTheme.id];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={`Tema: ${currentTheme.label}`}
        aria-label={`Alternar tema visual (atual: ${currentTheme.label})`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-xl bg-surface-2 text-foreground hover:bg-surface-3 transition-colors border border-border cursor-pointer"
      >
        <CurrentIcon size={16} className="text-primary shrink-0" />
        <span className="hidden xl:inline text-xs font-medium text-text-secondary">
          {currentTheme.label}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Selecionar tema visual"
          className="absolute right-0 mt-2 w-56 bg-surface border border-border-strong rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 border-b border-border text-xs font-semibold text-muted-foreground tracking-wide">
            Tema da Plataforma
          </div>
          <div className="p-1.5 space-y-0.5">
            {themes.map((t) => {
              const Icon = THEME_ICONS[t.id];
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary-soft text-primary font-semibold"
                      : "text-foreground hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-border-strong"
                      style={{ backgroundColor: t.previewPrimary }}
                      aria-hidden="true"
                    />
                    <Icon size={15} className={isSelected ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
                    <span className="truncate">{t.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
