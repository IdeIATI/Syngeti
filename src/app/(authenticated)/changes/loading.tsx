export default function ChangesLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse select-none" aria-busy="true">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface p-6 rounded-2xl border border-border/50 gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-60 bg-surface-elevated rounded-lg" />
          <div className="h-4 w-72 bg-muted/30 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-primary/30 rounded-lg" />
      </div>

      <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="h-12 bg-surface-elevated/60 border-b border-border/40 px-6 flex items-center gap-4">
          <div className="h-3 w-24 bg-muted/50 rounded" />
          <div className="h-3 w-56 bg-muted/50 rounded flex-1" />
          <div className="h-3 w-28 bg-muted/50 rounded" />
          <div className="h-3 w-20 bg-muted/50 rounded" />
        </div>
        <div className="divide-y divide-border/30">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-16 px-6 flex items-center gap-4">
              <div className="h-4 w-20 bg-muted/40 rounded" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-60 bg-muted/40 rounded" />
                <div className="h-2.5 w-32 bg-muted/20 rounded" />
              </div>
              <div className="h-6 w-20 bg-muted/30 rounded-full" />
              <div className="h-6 w-20 bg-muted/40 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
