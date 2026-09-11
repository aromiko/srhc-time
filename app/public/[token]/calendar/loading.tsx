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
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8">
        <section>
          <Skeleton className="h-6 w-44" />
          <div className="mt-3">
            <CalendarBlock />
          </div>
        </section>
        <section>
          <Skeleton className="h-6 w-24" />
          <div className="mt-3">
            <CalendarBlock />
          </div>
        </section>
      </div>
    </div>
  );
}
