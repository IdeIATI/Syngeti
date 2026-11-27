import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: "1" | "2";
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING_CLASSES = {
  none: "p-0",
  sm: "p-4",
  md: "p-[18px] sm:p-5",
  lg: "p-6",
};

export function Card({
  surface = "1",
  interactive = false,
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  const bgClass = surface === "2" ? "bg-surface-2" : "bg-surface-1";
  const interactiveClass = interactive
    ? "hover:border-border-strong hover:-translate-y-0.5 transition-all duration-150"
    : "transition-colors duration-150";

  return (
    <div
      className={`${bgClass} border border-border rounded-[14px] shadow-[var(--shadow-card)] ${PADDING_CLASSES[padding]} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-start justify-between gap-3 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`font-display text-[15px] font-semibold text-foreground leading-snug ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-[13px] text-text-muted leading-snug mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 pt-3 border-t border-border flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
