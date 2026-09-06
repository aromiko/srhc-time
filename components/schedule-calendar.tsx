import { WeekCalendar } from "@/components/week-calendar";
import type { MonthCalendarEvent } from "@/components/month-calendar";
import { SHIFT_PILL_CLASSES, SHIFT_DOT_CLASSES } from "@/lib/shift-colors";
import type { ShiftColor } from "@/lib/types";

export type ScheduleEvent = {
  id: string;
  date: string;
  label: string;
  color: ShiftColor;
  /**
   * Shift type name - shown once as a heading per group of same-shift
   * entries on a day. Omit when a day can only ever have one entry (e.g. an
   * employee's own schedule), where a group header would just repeat the
   * label right below it.
   */
  groupLabel?: string;
  /** shift_types.sort_order - keeps e.g. 7AM Duty at the top of each day rather than alphabetical. */
  sortOrder?: number;
  /** schedules.notes - shown inline beside the name, e.g. "Dolor — DOH seminar". */
  note?: string | null;
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
  const weekEvents: MonthCalendarEvent[] = [...events]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((e) => ({
      id: e.id,
      start_date: e.date,
      end_date: e.date,
      label: e.note ? `${e.label} — ${e.note}` : e.label,
      className: SHIFT_PILL_CLASSES[e.color],
      groupLabel: e.groupLabel,
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
