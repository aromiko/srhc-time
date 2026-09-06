import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="flex gap-3">
        <Skeleton className="h-16 flex-1" />
        <Skeleton className="h-16 flex-1" />
        <Skeleton className="h-16 flex-1" />
      </div>
      <Skeleton className="mt-4 h-20 w-full" />
      <Skeleton className="mt-8 h-7 w-56" />
      <div className="mt-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
