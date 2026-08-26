import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-3 h-32 w-full" />
      </div>
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-3 h-40 w-full" />
      </div>
    </div>
  );
}
