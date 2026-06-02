import { Skeleton } from "@/components/ui/skeleton";

export default function ProposalLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex h-16 items-center gap-4 border-b px-6 bg-card">
        <Skeleton className="size-7" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <main className="flex-1 p-6 lg:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="border rounded-xl p-6 space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-64" />
          <div className="space-y-2 pt-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
