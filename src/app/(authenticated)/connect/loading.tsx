export default function ConnectLoading() {
  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl border border-border/50 bg-surface overflow-hidden animate-pulse select-none" aria-busy="true">
      {/* Sidebar do Chat */}
      <div className="w-80 border-r border-border/40 p-4 space-y-4 hidden md:block">
        <div className="h-9 w-full bg-surface-elevated rounded-xl" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-muted/40 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 bg-muted/50 rounded" />
                <div className="h-2.5 w-44 bg-muted/30 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área Principal de Mensagens */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border/30">
          <div className="w-9 h-9 rounded-full bg-muted/40" />
          <div className="space-y-1">
            <div className="h-4 w-36 bg-muted/50 rounded" />
            <div className="h-2.5 w-24 bg-muted/30 rounded" />
          </div>
        </div>

        <div className="space-y-4 my-auto">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted/30 shrink-0" />
            <div className="h-12 w-64 bg-surface-elevated rounded-2xl" />
          </div>
          <div className="flex gap-3 justify-end">
            <div className="h-10 w-48 bg-primary/20 rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted/30 shrink-0" />
            <div className="h-16 w-80 bg-surface-elevated rounded-2xl" />
          </div>
        </div>

        <div className="h-12 w-full bg-surface-elevated rounded-xl border border-border/40" />
      </div>
    </div>
  );
}
