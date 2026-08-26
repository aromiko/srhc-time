import Link from "next/link";
import { getMonthMatrix, MONTH_LABELS, WEEKDAY_LABELS } from "@/lib/calendar-utils";

export type CalendarEvent = {
  id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved";
  label: string;
  mine: boolean;
};

function eventPillClasses(e: CalendarEvent) {
  if (e.status === "pending") {
    return "border border-dashed border-amber-300 bg-amber-50 text-amber-700";
  }
  return e.mine ? "bg-gold-100 text-gold-800" : "bg-green-100 text-green-800";
}

export function LeaveCalendar({
  year,
  month,
  events,
  basePath,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  basePath: string;
}) {
  const weeks = getMonthMatrix(year, month);
  const now = new Date();

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  const eventsOn = (iso: string) =>
    events.filter((e) => e.start_date <= iso && e.end_date >= iso);

  // Agenda: one entry per in-month day that has at least one event.
  const agendaDays = weeks
    .flat()
    .filter((d) => d.inMonth)
    .map((d) => ({ day: d, dayEvents: eventsOn(d.iso) }))
    .filter((d) => d.dayEvents.length > 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">
          {MONTH_LABELS[month - 1]} {year}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`${basePath}?y=${prev.y}&m=${prev.m}`}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← Prev
          </Link>
          <Link
            href={`${basePath}?y=${now.getFullYear()}&m=${now.getMonth() + 1}`}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Today
          </Link>
          <Link
            href={`${basePath}?y=${next.y}&m=${next.m}`}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Next →
          </Link>
        </div>
      </div>

      {/* Mobile: agenda list */}
      <div className="mt-4 space-y-2 md:hidden">
        {agendaDays.length === 0 && (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            No leave planned this month.
          </p>
        )}
        {agendaDays.map(({ day, dayEvents }) => (
          <div key={day.iso} className="rounded-lg border border-slate-200 bg-white p-3">
            <p
              className={`text-sm font-medium ${day.isToday ? "text-brand-700" : "text-slate-700"}`}
            >
              {day.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              {day.isToday && " · Today"}
            </p>
            <div className="mt-2 space-y-1.5">
              {dayEvents.map((e) => (
                <p
                  key={e.id}
                  className={`rounded px-2 py-1 text-sm ${eventPillClasses(e)}`}
                >
                  {e.label}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: month grid */}
      <div className="mt-4 hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="px-2 py-2 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((day) => {
            const dayEvents = eventsOn(day.iso);
            return (
              <div
                key={day.iso}
                className={`min-h-24 border-b border-r border-slate-100 p-1.5 last:border-r-0 ${
                  day.inMonth ? "bg-white" : "bg-slate-50"
                }`}
              >
                <p
                  className={`text-xs ${
                    day.isToday
                      ? "font-semibold text-brand-700"
                      : day.inMonth
                        ? "text-slate-700"
                        : "text-slate-300"
                  }`}
                >
                  {day.date.getDate()}
                </p>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <p
                      key={e.id}
                      title={e.label}
                      className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${eventPillClasses(e)}`}
                    >
                      {e.label}
                    </p>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-gold-200" /> My approved leave
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-green-200" /> Approved
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded border border-dashed border-amber-400 bg-amber-50" />
          Pending
        </span>
      </div>
    </div>
  );
}
