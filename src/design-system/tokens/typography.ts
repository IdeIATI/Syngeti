export const TYPOGRAPHY_TOKENS = {
  fontFamily: {
    sans: 'var(--font-inter), "Inter", Arial, sans-serif',
    display: 'var(--font-exo2), "Exo 2", var(--font-inter), Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    functionalMin: "13px",
    body: "14px",
    bodyLg: "16px",
    h3: "16px",
    h2: "20px",
    h1: "28px",
    kpi: "36px",
  },
} as const;
