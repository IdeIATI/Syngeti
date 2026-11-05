export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse select-none" aria-busy="true">
      {/* Header Profile / Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-8 w-48 bg-surface-elevated/80 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-10 w-44 bg-surface-elevated/70 rounded-xl border border-border/40" />
      </div>

      {/* 4 Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface rounded-2xl border border-border/50 p-4 sm:p-6 flex flex-col justify-between h-36">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface-elevated/80" />
              <div className="h-4 w-28 bg-muted/50 rounded-md" />
            </div>
            <div className="flex items-end justify-between">
              <div className="h-9 w-16 bg-surface-elevated rounded-lg" />
              <div className="h-3 w-20 bg-muted/30 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 3 Columns Bottom Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Gráfico de Categorias */}
        <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/50 flex flex-col min-h-[300px]">
          <div className="h-4 w-36 bg-muted/60 rounded-md mb-6" />
          <div className="flex-1 rounded-xl bg-surface-elevated/40 border border-border/30 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-muted/30 border-t-primary/40 animate-spin" />
          </div>
        </div>

        {/* Últimos Chamados */}
        <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/50 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-6">
            <div className="h-4 w-32 bg-muted/60 rounded-md" />
            <div className="h-3 w-16 bg-muted/40 rounded-md" />
          </div>
          <div className="space-y-3.5 flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="space-y-1">
                  <div className="h-3.5 w-40 bg-muted/50 rounded-md" />
                  <div className="h-2.5 w-24 bg-muted/30 rounded-md" />
                </div>
                <div className="h-5 w-16 bg-surface-elevated rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Equipamentos Recentes */}
        <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/50 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-6">
            <div className="h-4 w-36 bg-muted/60 rounded-md" />
            <div className="h-3 w-16 bg-muted/40 rounded-md" />
          </div>
          <div className="space-y-3.5 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="space-y-1">
                  <div className="h-3.5 w-36 bg-muted/50 rounded-md" />
                  <div className="h-2.5 w-20 bg-muted/30 rounded-md" />
                </div>
                <div className="h-5 w-14 bg-surface-elevated rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
