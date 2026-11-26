import React from "react";

interface SyngetiIconProps {
  size?: number;
  className?: string;
}

/**
 * Ícone oficial SyngeTI: hexágono tecnológico com nuvem integrada, servidores e nós de rede.
 * Nítido de 16px a 256px e adaptável via tokens de cor do tema ativo.
 */
export function SyngetiIcon({ size = 32, className = "" }: SyngetiIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Ícone SyngeTI"
    >
      <path
        d="M64 8L113.5 36.5V91.5L64 120L14.5 91.5V36.5L64 8Z"
        fill="#081522"
        stroke="var(--primary)"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M64 15L107 40V88L64 113L21 88V40L64 15Z"
        stroke="var(--primary)"
        strokeOpacity="0.28"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Nós de conectividade / infraestrutura */}
      <path
        d="M27 56H37M27 72H37M91 56H101M91 72H101M64 93V103M48 93V99M80 93V99"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="56" r="3" fill="var(--primary)" />
      <circle cx="24" cy="72" r="3" fill="var(--info)" />
      <circle cx="104" cy="56" r="3" fill="var(--primary)" />
      <circle cx="104" cy="72" r="3" fill="var(--info)" />
      <circle cx="64" cy="105" r="3" fill="var(--primary)" />
      <circle cx="48" cy="101" r="2.5" fill="var(--info)" />
      <circle cx="80" cy="101" r="2.5" fill="var(--info)" />

      {/* Nuvem tecnológica */}
      <path
        d="M44 63C38.5 63 34 58.6 34 53.2C34 48.3 37.6 44.3 42.3 43.5C44.1 35.8 51.1 30 59.5 30C69.1 30 77 37.6 77.5 47.1C82.4 47.6 86 51.7 86 56.8C86 60.2 84.3 63 81.5 63"
        stroke="var(--primary)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Servidores empilhados */}
      <rect
        x="40"
        y="57"
        width="48"
        height="14"
        rx="3.5"
        fill="#0F2942"
        stroke="var(--primary)"
        strokeWidth="2.6"
      />
      <circle cx="48" cy="64" r="1.9" fill="var(--primary)" />
      <circle cx="55" cy="64" r="1.9" fill="var(--primary)" />
      <circle cx="62" cy="64" r="1.9" fill="#14B8A6" />
      <line x1="70" y1="64" x2="82" y2="64" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" />

      <rect
        x="40"
        y="76"
        width="48"
        height="14"
        rx="3.5"
        fill="#0F2942"
        stroke="var(--info)"
        strokeWidth="2.6"
      />
      <circle cx="48" cy="83" r="1.9" fill="var(--primary)" />
      <circle cx="55" cy="83" r="1.9" fill="var(--info)" />
      <circle cx="62" cy="83" r="1.9" fill="#14B8A6" />
      <line x1="70" y1="83" x2="82" y2="83" stroke="var(--info)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

interface SyngetiWordmarkProps {
  variant?: "sidebar" | "login" | "compact";
  showSubtitle?: boolean;
}

/**
 * Assinatura tipográfica oficial SyngeTI com subtítulo "Sistema de Integração e Gestão de TI".
 * Preserva geometria e tipografia Exo 2 + Inter entre todos os temas.
 */
export function SyngetiWordmark({
  variant = "sidebar",
  showSubtitle = true,
}: SyngetiWordmarkProps) {
  if (variant === "login") {
    return (
      <div className="flex flex-col min-w-0">
        <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-none">
          Synge<span className="text-primary">TI</span>
        </span>
        {showSubtitle && (
          <div className="flex items-center gap-2 mt-2">
            <span className="w-5 h-px bg-primary/60 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium text-text-secondary tracking-wide">
              Sistema de Integração e Gestão de TI
            </span>
            <span className="w-5 h-px bg-primary/60 shrink-0" aria-hidden="true" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center min-w-0">
      <span
        className={`font-display font-bold text-foreground tracking-tight leading-none block truncate ${
          variant === "compact" ? "text-lg" : "text-xl"
        }`}
      >
        Synge<span className="text-primary">TI</span>
      </span>
      {showSubtitle && (
        <span className="text-[11px] font-medium text-muted-foreground leading-tight mt-0.5 truncate">
          Sistema de Integração e Gestão de TI
        </span>
      )}
    </div>
  );
}
