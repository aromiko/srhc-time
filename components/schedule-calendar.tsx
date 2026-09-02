import { MonthCalendar, type MonthCalendarEvent } from "@/components/month-calendar";
import { SHIFT_PILL_CLASSES, SHIFT_DOT_CLASSES } from "@/lib/shift-colors";
import type { ShiftColor } from "@/lib/types";

export type ScheduleEvent = {
  id: string;
  date: string;
  label: string;
  color: ShiftColor;
};

export function ScheduleCalendar({
  year,
  month,
  events,
  basePath,
  extraQuery,
  shiftLegend,
}: {
  year: number;
  month: number;
  events: ScheduleEvent[];
  basePath: string;
  extraQuery?: string;
  shiftLegend: { name: string; color: ShiftColor }[];
}) {
  const monthEvents: MonthCalendarEvent[] = events.map((e) => ({
    id: e.id,
    start_date: e.date,
    end_date: e.date,
    label: e.label,
    className: SHIFT_PILL_CLASSES[e.color],
  }));

  const legend = (
    <>
      {shiftLegend.map((s) => (
        <span key={s.name} className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded ${SHIFT_DOT_CLASSES[s.color]}`} />
          {s.name}
        </span>
      ))}
    </>
  );

  return (
    <MonthCalendar
      year={year}
      month={month}
      events={monthEvents}
      basePath={basePath}
      extraQuery={extraQuery}
      legend={legend}
      emptyAgendaMessage="No shifts assigned this month."
    />
  );
}
