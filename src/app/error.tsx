"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na aplicação capturado por error.tsx:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 selection:bg-primary-soft">
      <div className="w-full max-w-md text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mb-6 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-danger mb-2">
          Falha no Servidor
        </span>

        <h1 className="font-display text-2xl font-bold text-foreground mb-3">
          Ocorreu um erro inesperado
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-sm">
          A requisição não pôde ser completada no momento. Você pode tentar recarregar a página ou voltar para a tela de login.
        </p>

        {error?.digest && (
          <p className="text-xs font-mono text-muted-foreground mb-6 bg-surface-2 px-3 py-1 rounded-md border border-border">
            Código de rastreio: {error.digest}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-foreground font-semibold text-sm transition-colors"
          >
            Ir para o Login
          </a>
        </div>
      </div>
    </div>
  );
}
