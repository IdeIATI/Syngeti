"use client";

import React from "react";
import { BrandIcon, BrandLogo } from "@/design-system/components";

interface SyngetiIconProps {
  size?: 16 | 24 | 32 | 48 | 64 | 128 | 256 | number;
  simplified?: boolean;
  className?: string;
}

export function SyngetiIcon({ size = 32, simplified, className = "" }: SyngetiIconProps) {
  return <BrandIcon size={size} simplified={simplified} className={className} />;
}

interface SyngetiWordmarkProps {
  variant?: "sidebar" | "login" | "compact";
  showSubtitle?: boolean;
}

export function SyngetiWordmark({
  variant = "sidebar",
  showSubtitle = true,
}: SyngetiWordmarkProps) {
  const mappedSize = variant === "login" ? "lg" : "sm";
  return (
    <BrandLogo
      variant="auto"
      size={mappedSize}
      showSubtitle={showSubtitle}
      showIcon={false}
    />
  );
}
