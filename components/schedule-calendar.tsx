import { WeekCalendar } from "@/components/week-calendar";
import type { MonthCalendarEvent } from "@/components/month-calendar";
import { SHIFT_PILL_CLASSES, SHIFT_DOT_CLASSES } from "@/lib/shift-colors";
import type { ShiftColor } from "@/lib/types";

export type ScheduleEvent = {
  id: string;
  date: string;
  label: string;
  color: ShiftColor;
};

export function ScheduleCalendar({
  weekStartISO,
  events,
  basePath,
  extraQuery,
  shiftLegend,
}: {
  weekStartISO: string;
  events: ScheduleEvent[];
  basePath: string;
  extraQuery?: string;
  shiftLegend: { name: string; color: ShiftColor }[];
}) {
  const weekEvents: MonthCalendarEvent[] = events.map((e) => ({
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
    <WeekCalendar
      weekStartISO={weekStartISO}
      events={weekEvents}
      basePath={basePath}
      extraQuery={extraQuery}
      legend={legend}
    />
  );
}
