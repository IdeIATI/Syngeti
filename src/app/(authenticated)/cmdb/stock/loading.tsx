export default function StockLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse select-none">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-xl border border-border shadow-sm">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-surface-hover/80 rounded-lg"></div>
          <div className="h-4 w-96 bg-surface-hover/50 rounded-md"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-surface-hover rounded-lg"></div>
          <div className="h-10 w-36 bg-surface-hover rounded-lg"></div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface p-4 rounded-xl border border-border shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-surface-hover/60 rounded"></div>
              <div className="h-6 w-6 bg-surface-hover/80 rounded-md"></div>
            </div>
            <div className="h-7 w-16 bg-surface-hover rounded"></div>
            <div className="h-2.5 w-32 bg-surface-hover/40 rounded"></div>
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="h-12 w-full bg-surface rounded-xl border border-border"></div>

      {/* Table Skeleton */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="h-10 w-full bg-surface-hover/40 rounded-lg"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 w-full bg-surface-hover/30 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
