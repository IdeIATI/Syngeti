import React from "react";

export interface BrandIconProps {
  size?: 16 | 24 | 32 | 48 | 64 | 128 | 256 | number;
  simplified?: boolean;
  className?: string;
}

/**
 * Ícone tecnológico oficial SyngeTI.
 * Preserva identidade própria (navy + ciano tecnológico) em todos os temas,
 * inclusive no tema D'Lamb. Em <= 32px ou simplified=true, usa traços otimizados.
 */
export function BrandIcon({ size = 32, simplified, className = "" }: BrandIconProps) {
  const isCompact = simplified ?? size <= 32;

  if (isCompact) {
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
          d="M64 10L111 37.2V90.8L64 118L17 90.8V37.2L64 10Z"
          fill="#071524"
          stroke="#05ABC4"
          strokeWidth="6.5"
          strokeLinejoin="round"
        />
        <path
          d="M44 58C38.5 58 35 54 35 49.5C35 45.2 38.2 41.8 42.5 41.2C44.5 34.5 51 30 59 30C68 30 75 36.8 75.5 45.5C80 46 83.5 49.5 83.5 53.8C83.5 56.4 81.8 58 79.5 58"
          stroke="#37DFDC"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="38" y="61" width="52" height="15" rx="4" fill="#0A1C2E" stroke="#37DFDC" strokeWidth="4.2" />
        <circle cx="48" cy="68.5" r="3" fill="#37DFDC" />
        <rect x="38" y="82" width="52" height="15" rx="4" fill="#0A1C2E" stroke="#05ABC4" strokeWidth="4.2" />
        <circle cx="48" cy="89.5" r="3" fill="#05ABC4" />
        <circle cx="25" cy="64" r="3.8" fill="#37DFDC" />
        <circle cx="103" cy="64" r="3.8" fill="#37DFDC" />
        <circle cx="64" cy="106" r="3.8" fill="#05ABC4" />
      </svg>
    );
  }

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
        fill="#071524"
        stroke="#05ABC4"
        strokeWidth="4.2"
        strokeLinejoin="round"
      />
      <path
        d="M64 15L107 40V88L64 113L21 88V40L64 15Z"
        stroke="#05ABC4"
        strokeOpacity="0.28"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Nós de conectividade / infraestrutura */}
      <path
        d="M27 56H37M27 72H37M91 56H101M91 72H101M64 93V103M48 93V99M80 93V99"
        stroke="#05ABC4"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="24" cy="56" r="3" fill="#37DFDC" />
      <circle cx="24" cy="72" r="3" fill="#05ABC4" />
      <circle cx="104" cy="56" r="3" fill="#37DFDC" />
      <circle cx="104" cy="72" r="3" fill="#05ABC4" />
      <circle cx="64" cy="105" r="3" fill="#37DFDC" />
      <circle cx="48" cy="101" r="2.5" fill="#05ABC4" />
      <circle cx="80" cy="101" r="2.5" fill="#05ABC4" />

      {/* Nuvem tecnológica */}
      <path
        d="M44 63C38.5 63 34 58.6 34 53.2C34 48.3 37.6 44.3 42.3 43.5C44.1 35.8 51.1 30 59.5 30C69.1 30 77 37.6 77.5 47.1C82.4 47.6 86 51.7 86 56.8C86 60.2 84.3 63 81.5 63"
        stroke="#37DFDC"
        strokeWidth="3.2"
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
        fill="#0A1C2E"
        stroke="#37DFDC"
        strokeWidth="2.5"
      />
      <circle cx="48" cy="64" r="1.9" fill="#37DFDC" />
      <circle cx="55" cy="64" r="1.9" fill="#05ABC4" />
      <circle cx="62" cy="64" r="1.9" fill="#01ACBB" />
      <line x1="70" y1="64" x2="82" y2="64" stroke="#37DFDC" strokeWidth="2.2" strokeLinecap="round" />

      <rect
        x="40"
        y="76"
        width="48"
        height="14"
        rx="3.5"
        fill="#0A1C2E"
        stroke="#05ABC4"
        strokeWidth="2.5"
      />
      <circle cx="48" cy="83" r="1.9" fill="#37DFDC" />
      <circle cx="55" cy="83" r="1.9" fill="#05ABC4" />
      <circle cx="62" cy="83" r="1.9" fill="#01ACBB" />
      <line x1="70" y1="83" x2="82" y2="83" stroke="#05ABC4" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
