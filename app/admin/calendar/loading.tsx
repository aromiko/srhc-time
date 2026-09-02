import { Skeleton } from "@/components/skeleton";

function CalendarBlock() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <Skeleton className="mt-4 h-64 w-full" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-10">
      <section>
        <Skeleton className="h-6 w-16" />
        <div className="mt-3">
          <CalendarBlock />
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="mt-3">
          <CalendarBlock />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>
    </div>
  );
}
