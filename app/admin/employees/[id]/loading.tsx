import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-20" />
      </div>
      <div>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-3 h-32 w-full" />
      </div>
      <div>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-28 w-full" />
      </div>
      <div>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-3 h-32 w-full" />
      </div>
    </div>
  );
}
