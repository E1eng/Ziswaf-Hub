import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      {/* PageHeader skeleton */}
      <div className="flex h-16 items-center gap-4 border-b px-6 bg-card">
        <Skeleton className="size-7" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        {/* KPI grid skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-5" />
              </div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Chart row skeleton */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 border rounded-xl p-6 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-[220px] w-full" />
          </div>
          <div className="border rounded-xl p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-[220px] w-full" />
          </div>
        </div>

        {/* Pool grid skeleton */}
        <div className="border rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
