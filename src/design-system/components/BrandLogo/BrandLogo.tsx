"use client";

import React from "react";
import { useTheme } from "../../ThemeProvider";
import { BrandIcon } from "../BrandIcon/BrandIcon";

export interface BrandLogoProps {
  variant?: "auto" | "positive" | "negative";
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
  align?: "center" | "left";
  showIcon?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: {
    title: "text-[22px]",
    subtitle: "text-[11px]",
    iconSize: 32,
    gap: "gap-2.5",
    lineWidth: "w-3",
  },
  md: {
    title: "text-[28px]",
    subtitle: "text-xs",
    iconSize: 48,
    gap: "gap-3",
    lineWidth: "w-4",
  },
  lg: {
    title: "text-4xl sm:text-[42px]",
    subtitle: "text-xs sm:text-[13px]",
    iconSize: 64,
    gap: "gap-4",
    lineWidth: "w-5",
  },
} as const;

/**
 * Logotipo oficial SyngeTI com assinatura "Plataforma de Gestão de TI".
 * Preserva identidade independente SyngeTI (nunca fica vermelho no tema D'Lamb):
 * - negative: fundo escuro ("Synge" claro + "TI" ciano)
 * - positive: fundo claro ("Synge" grafite/navy + "TI" ciano)
 * - auto: segue automaticamente o tema ativo (via CSS tokens + ThemeProvider)
 */
export function BrandLogo({
  variant = "auto",
  showSubtitle = true,
  size = "md",
  align = "center",
  showIcon = false,
  className = "",
}: BrandLogoProps) {
  const { isDark } = useTheme();
  const cfg = SIZE_MAP[size];

  const resolvedVariant =
    variant === "auto" ? (isDark ? "negative" : "positive") : variant;

  const syngeColorClass =
    variant === "auto"
      ? "text-[var(--brand-wordmark)]"
      : resolvedVariant === "negative"
        ? "text-[#F4F7FB]"
        : "text-[#0A1C2E]";

  const tiColorClass =
    variant === "auto"
      ? "text-[var(--brand-ti)]"
      : "text-[#05ABC4]";

  const subtitleColorClass =
    variant === "auto"
      ? "text-[var(--brand-subtitle)]"
      : resolvedVariant === "negative"
        ? "text-[#A9BBCB]"
        : "text-[#55575C]";

  const ruleColorClass =
    variant === "auto"
      ? "bg-[var(--brand-ti)]/60"
      : "bg-[#05ABC4]/60";

  const alignClass = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex items-center ${cfg.gap} min-w-0 ${className}`}>
      {showIcon && <BrandIcon size={cfg.iconSize} className="shrink-0" />}
      <div className={`inline-flex flex-col justify-center ${alignClass} min-w-0`}>
        <span
          className={`font-display font-bold tracking-tight leading-[1.2] pb-0.5 block whitespace-nowrap ${cfg.title} ${syngeColorClass}`}
        >
          Synge<span className={tiColorClass}>TI</span>
        </span>
        {showSubtitle && (
          <div className={`flex items-center justify-center gap-1.5 ${size === "sm" ? "mt-0" : "mt-0.5"} min-w-0`}>
            {size !== "sm" && (
              <span className={`${cfg.lineWidth} h-px shrink-0 ${ruleColorClass}`} aria-hidden="true" />
            )}
            <span className={`${cfg.subtitle} font-medium leading-tight ${size === "sm" ? "truncate" : "whitespace-nowrap"} ${subtitleColorClass}`}>
              Plataforma de Gestão de TI
            </span>
            {size !== "sm" && (
              <span className={`${cfg.lineWidth} h-px shrink-0 ${ruleColorClass}`} aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
