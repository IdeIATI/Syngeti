import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Exo_2 } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/design-system/ThemeProvider';
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
    title: 'SyngeTI — Plataforma de Gestão de TI',
    description: 'Plataforma de Gestão de TI — ITSM, CMDB, Estoque, Service Desk e Connect Chat',
    manifest: '/manifest.webmanifest',
    icons: {
      icon: branding?.favicon || '/branding/syngeti-icon-simple.svg',
      shortcut: branding?.favicon || '/branding/syngeti-icon-simple.svg',
      apple: branding?.appIcon || '/branding/syngeti-icon.svg',
    },
  };
}

const PWA_STANDALONE_INIT_SCRIPT = `(function(){try{var d=function(){var m=window.matchMedia;return (m&&(m('(display-mode: standalone)').matches||m('(display-mode: window-controls-overlay)').matches||m('(display-mode: minimal-ui)').matches))||window.navigator.standalone===true||document.referrer.indexOf('android-app://')!==-1;};if(d()){document.documentElement.setAttribute('data-pwa-standalone','true');}window.addEventListener('appinstalled',function(){document.documentElement.setAttribute('data-pwa-standalone','true');});}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${inter.variable} ${exo2.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: PWA_STANDALONE_INIT_SCRIPT }} />
      </head>
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
