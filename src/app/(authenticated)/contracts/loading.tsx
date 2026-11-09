export default function ContractsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse select-none" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface p-6 rounded-2xl border border-border/50 gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-60 bg-surface-elevated rounded-lg" />
          <div className="h-4 w-72 bg-muted/30 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-primary/30 rounded-lg" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface p-5 rounded-2xl border border-border/50 space-y-2">
            <div className="h-3.5 w-24 bg-muted/30 rounded" />
            <div className="h-7 w-32 bg-surface-elevated rounded-md" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        <div className="h-12 bg-surface-elevated/60 border-b border-border/40 px-6 flex items-center gap-4">
          <div className="h-3 w-32 bg-muted/50 rounded" />
          <div className="h-3 w-40 bg-muted/50 rounded flex-1" />
          <div className="h-3 w-28 bg-muted/50 rounded" />
          <div className="h-3 w-24 bg-muted/50 rounded" />
        </div>
        <div className="divide-y divide-border/30">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-16 px-6 flex items-center gap-4">
              <div className="space-y-1 w-32">
                <div className="h-4 w-28 bg-muted/40 rounded" />
                <div className="h-2.5 w-16 bg-muted/20 rounded" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="h-4 w-52 bg-muted/40 rounded" />
                <div className="h-2.5 w-24 bg-muted/20 rounded" />
              </div>
              <div className="h-4 w-24 bg-muted/30 rounded" />
              <div className="h-6 w-20 bg-muted/40 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
