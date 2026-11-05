export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-5 animate-pulse select-none" aria-busy="true">
      <div className="bg-surface p-5 rounded-2xl border border-border/50 space-y-1.5">
        <div className="h-6 w-48 bg-surface-elevated rounded-lg" />
        <div className="h-3.5 w-72 bg-muted/30 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface p-5 rounded-2xl border border-border/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated" />
            <div className="h-4 w-36 bg-muted/50 rounded" />
            <div className="h-3 w-48 bg-muted/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
