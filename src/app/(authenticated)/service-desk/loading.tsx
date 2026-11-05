export default function ServiceDeskLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse select-none" aria-busy="true">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-border/50">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-36 bg-surface-elevated rounded-lg" />
            <div className="h-5 w-16 bg-muted/40 rounded-full" />
          </div>
          <div className="h-3.5 w-64 bg-muted/30 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="h-9 w-24 bg-surface-elevated rounded-xl border border-border/40" />
          <div className="h-9 w-36 bg-primary/30 rounded-xl" />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 sm:p-4 rounded-xl border border-border/50">
        <div className="h-9 w-full sm:w-72 bg-surface-elevated rounded-lg" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-surface-elevated rounded-lg" />
          <div className="h-8 w-24 bg-surface-elevated rounded-lg" />
          <div className="h-8 w-24 bg-surface-elevated rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-surface rounded-2xl border border-border/50 overflow-hidden shadow-2xs">
        {/* Table Header */}
        <div className="h-11 bg-surface-elevated/60 border-b border-border/40 px-4 flex items-center gap-4">
          <div className="h-3 w-16 bg-muted/50 rounded" />
          <div className="h-3 w-48 bg-muted/50 rounded flex-1" />
          <div className="h-3 w-28 bg-muted/50 rounded hidden sm:block" />
          <div className="h-3 w-24 bg-muted/50 rounded hidden md:block" />
          <div className="h-3 w-20 bg-muted/50 rounded" />
          <div className="h-3 w-20 bg-muted/50 rounded hidden lg:block" />
          <div className="h-3 w-16 bg-muted/50 rounded" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/30">
          {[1, 2, 3, 4, 5, 6, 7].map((row) => (
            <div key={row} className="h-14 px-4 flex items-center gap-4">
              <div className="h-4 w-16 bg-muted/40 rounded-md" />
              <div className="space-y-1 flex-1">
                <div className="h-3.5 w-56 bg-muted/50 rounded" />
                <div className="h-2.5 w-32 bg-muted/30 rounded" />
              </div>
              <div className="h-4 w-28 bg-muted/40 rounded hidden sm:block" />
              <div className="h-4 w-20 bg-muted/30 rounded hidden md:block" />
              <div className="h-5 w-16 bg-muted/40 rounded-full" />
              <div className="h-4 w-24 bg-muted/40 rounded hidden lg:block" />
              <div className="h-5 w-20 bg-muted/40 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
