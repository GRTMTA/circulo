export function CircleListSkeleton() {
  return (
    <div className="grid gap-6" aria-label="Loading circles" aria-busy="true">
      <div className="space-y-3">
        <div className="h-8 w-44 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white" />)}
      </div>
      <div className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white" />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-white" />)}
      </div>
    </div>
  );
}
