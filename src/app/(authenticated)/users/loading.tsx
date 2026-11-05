export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse select-none" aria-busy="true">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-border/50">
        <div className="space-y-1.5">
          <div className="h-6 w-44 bg-surface-elevated rounded-lg" />
          <div className="h-3.5 w-60 bg-muted/30 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-primary/30 rounded-xl" />
      </div>

      <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden shadow-2xs divide-y divide-border/30">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted/40" />
              <div className="space-y-1">
                <div className="h-3.5 w-40 bg-muted/50 rounded" />
                <div className="h-2.5 w-52 bg-muted/30 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 bg-muted/40 rounded-full" />
              <div className="h-6 w-16 bg-muted/30 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
