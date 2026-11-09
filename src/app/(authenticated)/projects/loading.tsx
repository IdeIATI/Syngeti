export default function ProjectsLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse select-none" aria-busy="true">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface p-6 rounded-2xl border border-border/50 gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-64 bg-surface-elevated rounded-lg" />
          <div className="h-4 w-80 bg-muted/30 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-primary/30 rounded-lg" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface rounded-2xl border border-border/50 p-6 flex flex-col space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="h-5 w-40 bg-surface-elevated rounded" />
              <div className="h-5 w-16 bg-muted/40 rounded-md" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-full bg-muted/30 rounded" />
              <div className="h-3.5 w-3/4 bg-muted/30 rounded" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <div className="h-3 w-28 bg-muted/30 rounded" />
                <div className="h-3 w-8 bg-muted/30 rounded" />
              </div>
              <div className="h-2.5 w-full bg-muted/20 rounded-full" />
            </div>
            <div className="border-t border-border/40 pt-4 flex justify-between items-center">
              <div className="h-3.5 w-24 bg-muted/30 rounded" />
              <div className="h-4 w-16 bg-primary/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
