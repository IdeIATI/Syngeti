import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 selection:bg-primary-soft">
      <div className="w-full max-w-md text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
          Erro 404 • Página não encontrada
        </span>

        <h1 className="font-display text-3xl font-bold text-foreground mb-3">
          Recurso não localizado
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed mb-8 max-w-sm">
          A rota ou recurso que você tentou acessar não existe ou foi movido. Verifique o endereço digitado.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
