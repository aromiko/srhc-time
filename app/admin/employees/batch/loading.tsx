import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="mt-2 h-4 w-full" />
      <div className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
