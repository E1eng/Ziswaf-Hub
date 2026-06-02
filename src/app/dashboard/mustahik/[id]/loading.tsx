import { Skeleton } from "@/components/ui/skeleton";

export default function MustahikDetailLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex h-16 items-center gap-4 border-b px-6 bg-card">
        <Skeleton className="size-7" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl">
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </main>
    </div>
  );
}
