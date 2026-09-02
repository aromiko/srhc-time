import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getMonthRange, resolveYearMonth } from "@/lib/calendar-utils";
import { CalendarViewTabs } from "@/components/calendar-view-tabs";
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
  user_id: string;
  profile: { full_name: string } | null;
  shift_type: { name: string; color: ShiftColor } | null;
};

const BASE_PATH = "/dashboard/calendar";

export default async function EmployeeCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; view?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { y, m, view: viewParam } = await searchParams;
  const view = viewParam === "schedule" ? "schedule" : "leave";
  const { year, month } = resolveYearMonth(y, m);
  const { startISO, endISO } = getMonthRange(year, month);

  const supabase = await createClient();

  const tabs = <CalendarViewTabs basePath={BASE_PATH} year={year} month={month} view={view} />;

  if (view === "schedule") {
    const [{ data: schedules }, { data: shiftTypes }] = await Promise.all([
      supabase
        .from("schedules")
        .select(
          "id, date, user_id, profile:profiles!schedules_user_id_fkey(full_name), " +
            "shift_type:shift_types(name, color)",
        )
        .gte("date", startISO)
        .lte("date", endISO),
      supabase.from("shift_types").select("name, color").eq("is_active", true).order("name"),
    ]);

    const events: ScheduleEvent[] = ((schedules ?? []) as unknown as ScheduleRow[]).map((r) => ({
      id: r.id,
      date: r.date,
      color: r.shift_type?.color ?? "blue",
      label: `${r.user_id === user.profile.id ? "You" : r.profile?.full_name} · ${r.shift_type?.name}`,
    }));

    return (
      <div>
        {tabs}
        <div className="mt-4">
          <ScheduleCalendar
            year={year}
            month={month}
            events={events}
            basePath={BASE_PATH}
            extraQuery="view=schedule"
            shiftLegend={shiftTypes ?? []}
          />
        </div>
      </div>
    );
  }

  const [{ data: approved }, { data: ownPending }] = await Promise.all([
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
  ]);

  const events: CalendarEvent[] = [
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

  return (
    <div>
      {tabs}
      <div className="mt-4">
        <LeaveCalendar
          year={year}
          month={month}
          events={events}
          basePath={BASE_PATH}
          extraQuery="view=leave"
        />
      </div>
    </div>
  );
}
