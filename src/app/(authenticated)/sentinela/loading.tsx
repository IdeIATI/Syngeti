export default function SentinelaLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 animate-pulse select-none" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface p-6 rounded-2xl border border-border/50 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-48 bg-surface-elevated rounded-lg" />
            <div className="h-5 w-16 bg-primary/20 rounded-md" />
          </div>
          <div className="h-4 w-72 bg-muted/30 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-surface-elevated rounded-xl" />
      </div>

      {/* Health Gauges Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface p-5 rounded-2xl border border-border/50 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 bg-muted/30 rounded" />
              <div className="w-3 h-3 rounded-full bg-muted/40" />
            </div>
            <div className="h-8 w-20 bg-surface-elevated rounded-md" />
            <div className="h-2 w-full bg-muted/20 rounded-full" />
          </div>
        ))}
      </div>

      {/* Incidents Table / Dashboard Skeleton */}
      <div className="bg-surface rounded-2xl border border-border/50 p-6 space-y-4">
        <div className="h-5 w-44 bg-surface-elevated rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((r) => (
            <div key={r} className="p-4 rounded-xl bg-surface-elevated/40 border border-border/30 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-60 bg-muted/40 rounded" />
                <div className="h-3 w-40 bg-muted/20 rounded" />
              </div>
              <div className="h-6 w-20 bg-muted/30 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
