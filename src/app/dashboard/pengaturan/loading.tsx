import { Skeleton } from "@/components/ui/skeleton";

export default function PengaturanLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex h-16 items-center gap-4 border-b px-6 bg-card">
        <Skeleton className="size-7" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </main>
    </div>
  );
}
