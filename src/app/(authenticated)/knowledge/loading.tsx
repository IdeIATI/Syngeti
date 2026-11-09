export default function KnowledgeLoading() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-pulse select-none p-4 sm:p-6" aria-busy="true">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-surface p-6 rounded-2xl border border-border/50 gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-64 bg-surface-elevated rounded-lg" />
          <div className="h-4 w-80 bg-muted/30 rounded-md" />
        </div>
        <div className="h-10 w-44 bg-primary/30 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border/50 pb-2">
        <div className="h-8 w-28 bg-surface-elevated rounded-lg" />
        <div className="h-8 w-36 bg-surface-elevated/50 rounded-lg" />
      </div>

      {/* Grid of Manuals / Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface rounded-2xl border border-border/50 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-primary/20 rounded-md" />
              <div className="h-4 w-20 bg-muted/30 rounded" />
            </div>
            <div className="h-5 w-48 bg-surface-elevated rounded" />
            <div className="space-y-1">
              <div className="h-3.5 w-full bg-muted/30 rounded" />
              <div className="h-3.5 w-4/5 bg-muted/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
