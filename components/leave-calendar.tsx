import { MonthCalendar, type MonthCalendarEvent } from "@/components/month-calendar";

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
  const monthEvents: MonthCalendarEvent[] = events.map((e) => ({
    id: e.id,
    start_date: e.start_date,
    end_date: e.end_date,
    label: e.label,
    className: eventPillClasses(e),
  }));

  return (
    <MonthCalendar
      year={year}
      month={month}
      events={monthEvents}
      basePath={basePath}
      extraQuery={extraQuery}
      legend={legend}
      emptyAgendaMessage="No leave planned this month."
    />
  );
}
