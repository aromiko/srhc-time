import type { ReactNode } from "react";
import { addDaysISO, formatWeekRange, getWeekDays, resolveWeekStart } from "@/lib/calendar-utils";
import type { MonthCalendarEvent } from "@/components/month-calendar";
import { PendingLink } from "@/components/pending-link";

export function WeekCalendar({
  weekStartISO,
  events,
  basePath,
  extraQuery = "",
  legend,
}: {
  weekStartISO: string;
  events: MonthCalendarEvent[];
  basePath: string;
  extraQuery?: string;
  legend?: ReactNode;
}) {
  const days = getWeekDays(weekStartISO);
  const suffix = extraQuery ? `&${extraQuery}` : "";
  const prevWeek = addDaysISO(weekStartISO, -7);
  const nextWeek = addDaysISO(weekStartISO, 7);
  const thisWeek = resolveWeekStart();

  const eventsOn = (iso: string) => events.filter((e) => e.start_date <= iso && e.end_date >= iso);

  // Assumes `events` already arrives sorted by group - flags the first
  // event of each run of a shared groupLabel so a header can precede it.
  const withGroupHeaders = (dayEvents: MonthCalendarEvent[]) => {
    let lastGroup: string | undefined;
    return dayEvents.map((event) => {
      const showHeader = !!event.groupLabel && event.groupLabel !== lastGroup;
      lastGroup = event.groupLabel;
      return { event, showHeader };
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{formatWeekRange(weekStartISO)}</h3>
        <div className="flex items-center gap-2">
          <PendingLink
            href={`${basePath}?w=${prevWeek}${suffix}`}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← Prev
          </PendingLink>
          <PendingLink
            href={`${basePath}?w=${thisWeek}${suffix}`}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            This Week
          </PendingLink>
          <PendingLink
            href={`${basePath}?w=${nextWeek}${suffix}`}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Next →
          </PendingLink>
        </div>
      </div>

      {/* Mobile: stacked day list, every day shown */}
      <div className="mt-4 space-y-2 md:hidden">
        {days.map((day) => {
          const dayEvents = eventsOn(day.iso);
          return (
            <div key={day.iso} className="rounded-lg border border-slate-200 bg-white p-3">
              <p
                className={`text-sm font-medium ${day.isToday ? "text-brand-700" : "text-slate-700"}`}
              >
                {day.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
                {day.isToday && " · Today"}
              </p>
              <div className="mt-2 space-y-1.5">
                {dayEvents.length === 0 && <p className="text-sm text-slate-400">—</p>}
                {withGroupHeaders(dayEvents).map(({ event: e, showHeader }) => (
                  <div key={e.id}>
                    {showHeader && (
                      <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                        {e.groupLabel}
                      </p>
                    )}
                    <p className={`rounded px-2 py-1 text-sm ${e.className}`}>{e.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/tablet: 7-column grid */}
      <div className="mt-4 hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {days.map((day) => {
            const dayEvents = eventsOn(day.iso);
            return (
              <div key={day.iso} className={day.isToday ? "bg-brand-50" : ""}>
                <div className="border-b border-slate-200 bg-slate-50 px-2 py-2 text-center">
                  <p
                    className={`text-xs font-medium ${day.isToday ? "text-brand-700" : "text-slate-500"}`}
                  >
                    {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p
                    className={`text-sm ${day.isToday ? "font-semibold text-brand-700" : "text-slate-700"}`}
                  >
                    {day.date.getDate()}
                  </p>
                </div>
                <div className="min-h-32 space-y-0.5 p-1.5">
                  {withGroupHeaders(dayEvents).map(({ event: e, showHeader }) => (
                    <div key={e.id}>
                      {showHeader && (
                        <p className="mt-1.5 text-[9px] font-semibold tracking-wide text-slate-400 uppercase first:mt-0">
                          {e.groupLabel}
                        </p>
                      )}
                      <p
                        className={`rounded px-1.5 py-0.5 text-[11px] leading-tight wrap-break-word ${e.className}`}
                      >
                        {e.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {legend && <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">{legend}</div>}
    </div>
  );
}
