import { Skeleton } from "@/components/ui/skeleton";

export default function DonasiLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex h-16 items-center gap-4 border-b px-6 bg-card">
        <Skeleton className="size-7" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>

      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-5 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="border rounded-xl p-6 space-y-3">
          <Skeleton className="h-5 w-44" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
          <Skeleton className="lg:col-span-3 h-96 rounded-xl" />
        </div>
      </main>
    </div>
  );
}
