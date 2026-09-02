import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  addDaysISO,
  getMonthRange,
  resolveWeekStart,
  resolveYearMonth,
} from "@/lib/calendar-utils";
import { LeaveCalendar, type CalendarEvent } from "@/components/leave-calendar";
import { ScheduleCalendar, type ScheduleEvent } from "@/components/schedule-calendar";
import type { ShiftColor } from "@/lib/types";

type ApprovedRow = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  profile: { full_name: string } | null;
  leave_type: { name: string } | null;
};

type OwnPendingRow = {
  id: string;
  start_date: string;
  end_date: string;
  leave_type: { name: string } | null;
};

type ScheduleRow = {
  id: string;
  date: string;
  shift_type: { name: string; color: ShiftColor } | null;
};

const BASE_PATH = "/dashboard/calendar";

export default async function EmployeeCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; w?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { y, m, w } = await searchParams;
  const { year, month } = resolveYearMonth(y, m);
  const { startISO, endISO } = getMonthRange(year, month);
  const weekStartISO = resolveWeekStart(w);
  const weekEndISO = addDaysISO(weekStartISO, 6);

  const supabase = await createClient();

  const [{ data: approved }, { data: ownPending }, { data: schedules }, { data: shiftTypes }] =
    await Promise.all([
      supabase
        .from("leave_requests")
        .select(
          "id, user_id, start_date, end_date, " +
            "profile:profiles!leave_requests_user_id_fkey(full_name), " +
            "leave_type:leave_types(name)",
        )
        .eq("status", "approved")
        .lte("start_date", endISO)
        .gte("end_date", startISO),
      supabase
        .from("leave_requests")
        .select("id, start_date, end_date, leave_type:leave_types(name)")
        .eq("user_id", user.profile.id)
        .eq("status", "pending")
        .lte("start_date", endISO)
        .gte("end_date", startISO),
      // RLS already restricts this to the signed-in user's own rows, but
      // filtering explicitly here too keeps the query's intent obvious.
      supabase
        .from("schedules")
        .select("id, date, shift_type:shift_types(name, color)")
        .eq("user_id", user.profile.id)
        .gte("date", weekStartISO)
        .lte("date", weekEndISO),
      supabase.from("shift_types").select("name, color").eq("is_active", true).order("name"),
    ]);

  const leaveEvents: CalendarEvent[] = [
    ...((approved ?? []) as unknown as ApprovedRow[]).map((r) => ({
      id: r.id,
      start_date: r.start_date,
      end_date: r.end_date,
      status: "approved" as const,
      mine: r.user_id === user.profile.id,
      label: `${r.user_id === user.profile.id ? "You" : r.profile?.full_name} · ${r.leave_type?.name}`,
    })),
    ...((ownPending ?? []) as unknown as OwnPendingRow[]).map((r) => ({
      id: r.id,
      start_date: r.start_date,
      end_date: r.end_date,
      status: "pending" as const,
      mine: true,
      label: `You · ${r.leave_type?.name} (pending)`,
    })),
  ];

  const scheduleEvents: ScheduleEvent[] = ((schedules ?? []) as unknown as ScheduleRow[]).map(
    (r) => ({
      id: r.id,
      date: r.date,
      color: r.shift_type?.color ?? "blue",
      label: r.shift_type?.name ?? "Shift",
    }),
  );

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-lg font-semibold text-slate-900">Leave</h1>
        <div className="mt-3">
          <LeaveCalendar year={year} month={month} events={leaveEvents} basePath={BASE_PATH} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">My Schedule</h2>
        <p className="mt-1 text-sm text-slate-500">Only your own shifts are shown here.</p>
        <div className="mt-3">
          <ScheduleCalendar
            weekStartISO={weekStartISO}
            events={scheduleEvents}
            basePath={BASE_PATH}
            shiftLegend={shiftTypes ?? []}
          />
        </div>
      </section>
    </div>
  );
}
