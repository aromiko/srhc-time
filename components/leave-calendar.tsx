import { MonthCalendar, type MonthCalendarEvent } from "@/components/month-calendar";

export type CalendarEvent = {
  id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "absent";
  label: string;
  mine: boolean;
  /** Category header, e.g. "VL" / "SL" / "OL" / "ABSENCES" - see lib/leave-utils.ts's leaveTypeAbbr. */
  groupLabel: string;
  /** leave_types.sort_order (absences sort after all real leave types). */
  sortOrder?: number;
};

function eventPillClasses(e: CalendarEvent) {
  if (e.status === "absent") {
    return "bg-red-100 text-red-800";
  }
  if (e.status === "pending") {
    return "border border-dashed border-amber-300 bg-amber-50 text-amber-700";
  }
  return e.mine ? "bg-gold-100 text-gold-800" : "bg-green-100 text-green-800";
}

const legend = (
  <>
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
    <span className="flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded bg-red-200" /> Absent (unauthorized)
    </span>
  </>
);

export function LeaveCalendar({
  year,
  month,
  events,
  basePath,
  extraQuery,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  basePath: string;
  extraQuery?: string;
}) {
  const monthEvents: MonthCalendarEvent[] = [...events]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((e) => ({
      id: e.id,
      start_date: e.start_date,
      end_date: e.end_date,
      label: e.label,
      className: eventPillClasses(e),
      groupLabel: e.groupLabel,
    }));

  return (
    <MonthCalendar
      year={year}
      month={month}
      events={monthEvents}
      basePath={basePath}
      extraQuery={extraQuery}
      legend={legend}
      emptyAgendaMessage="No leave or absences this month."
    />
  );
}
