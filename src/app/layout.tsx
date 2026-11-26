import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Exo_2 } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getBranding } from '@/lib/branding';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-exo2',
  display: 'swap',
});

export const viewport: Viewport = {
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const branding = getBranding();
  return {
    title: 'SyngeTI — Sistema de Integração e Gestão de TI',
    description: 'Sistema de Integração e Gestão de TI — ITSM, CMDB, Estoque, Service Desk e Connect Chat',
    manifest: '/manifest.webmanifest',
    icons: {
      icon: branding?.favicon || '/branding/syngeti-icon.svg',
      shortcut: branding?.favicon || '/branding/syngeti-icon.svg',
      apple: branding?.appIcon || '/branding/syngeti-icon.svg',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${exo2.variable}`} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="h-full font-sans text-foreground bg-background antialiased"
      >
        <Script
          id="unhandled-rejection-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                function shouldIgnore(msg) {
                  return typeof msg === 'string' && (
                    msg.indexOf('A listener indicated an asynchronous response') !== -1 ||
                    msg.indexOf('message channel closed') !== -1 ||
                    msg.indexOf('Extension context invalidated') !== -1
                  );
                }
                window.addEventListener('unhandledrejection', function(event) {
                  var msg = (event && event.reason && (event.reason.message || event.reason)) || '';
                  if (shouldIgnore(msg)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                  }
                });
                window.addEventListener('error', function(event) {
                  var msg = (event && (event.message || (event.error && event.error.message))) || '';
                  if (shouldIgnore(msg)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return true;
                  }
                });
              }
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme={false}
          disableTransitionOnChange
          themes={['light', 'dark', 'tokyo-night', 'dlamb']}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
