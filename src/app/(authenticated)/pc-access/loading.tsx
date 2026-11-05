export default function PCAccessLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse select-none" aria-busy="true">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-border/50">
        <div className="space-y-1.5">
          <div className="h-6 w-52 bg-surface-elevated rounded-lg" />
          <div className="h-3.5 w-72 bg-muted/30 rounded-md" />
        </div>
        <div className="h-9 w-36 bg-primary/30 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface p-5 rounded-2xl border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-muted/50 rounded" />
              <div className="h-5 w-16 bg-muted/40 rounded-full" />
            </div>
            <div className="h-3.5 w-44 bg-muted/30 rounded" />
            <div className="pt-2 border-t border-border/30 flex justify-between items-center">
              <div className="h-3 w-24 bg-muted/40 rounded" />
              <div className="h-7 w-20 bg-surface-elevated rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
