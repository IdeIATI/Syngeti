import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getBranding } from '@/lib/branding';

export async function generateMetadata(): Promise<Metadata> {
  const branding = getBranding();
  return {
    title: 'SYNGETI - Sistema Integrado de Gestão de TI',
    description: 'Plataforma centralizada de ITSM, CMDB, e gestão de TI',
    icons: {
      icon: branding?.favicon || '/branding/logo-icon.png',
      shortcut: branding?.favicon || '/branding/logo-icon.png',
      apple: branding?.appIcon || '/branding/logo-icon.png',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="h-full text-foreground bg-background antialiased transition-colors duration-300"
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
