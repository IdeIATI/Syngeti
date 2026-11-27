"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:brightness-95 shadow-xs border border-transparent",
  secondary:
    "bg-surface-2 text-foreground hover:bg-surface-3 border border-border",
  outline:
    "bg-transparent text-foreground hover:bg-surface-2 border border-border-strong",
  ghost:
    "bg-transparent text-text-secondary hover:text-foreground hover:bg-surface-2 border border-transparent",
  danger:
    "bg-danger text-white hover:opacity-90 active:opacity-95 border border-transparent shadow-xs",
  success:
    "bg-success text-white hover:opacity-90 active:opacity-95 border border-transparent shadow-xs",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs rounded-lg gap-1.5",
  md: "h-[42px] px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-sm rounded-xl gap-2",
  icon: "h-10 w-10 p-0 rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`inline-flex items-center justify-center font-semibold transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
