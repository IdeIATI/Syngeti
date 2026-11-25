import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Manrope', 'Arial', 'sans-serif'],
        display: ['var(--font-exo2)', 'Exo 2', 'var(--font-inter)', 'Arial', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg-app)',
        foreground: 'var(--text-primary)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        border: 'var(--border-subtle)',
      },
    },
  },
  plugins: [],
};
export default config;
