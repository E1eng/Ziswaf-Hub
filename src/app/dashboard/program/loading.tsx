import { Skeleton } from "@/components/ui/skeleton";

export default function ProgramLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex h-16 items-center gap-4 border-b px-6 bg-card">
        <Skeleton className="size-7" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <main className="flex-1 p-6 lg:p-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </main>
    </div>
  );
}
