import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getMonthRange, resolveYearMonth } from "@/lib/calendar-utils";
import { CalendarViewTabs } from "@/components/calendar-view-tabs";
import { LeaveCalendar, type CalendarEvent } from "@/components/leave-calendar";
import { ScheduleCalendar, type ScheduleEvent } from "@/components/schedule-calendar";
import type { ShiftColor } from "@/lib/types";

type RequestRow = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved";
  profile: { full_name: string } | null;
  leave_type: { name: string } | null;
};

type ScheduleRow = {
  id: string;
  date: string;
  user_id: string;
  profile: { full_name: string } | null;
  shift_type: { name: string; color: ShiftColor } | null;
};

const BASE_PATH = "/admin/calendar";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; view?: string }>;
}) {
  const { y, m, view: viewParam } = await searchParams;
  const view = viewParam === "schedule" ? "schedule" : "leave";
  const { year, month } = resolveYearMonth(y, m);
  const { startISO, endISO } = getMonthRange(year, month);

  const [user, supabase] = await Promise.all([getCurrentUser(), createClient()]);

  const tabs = <CalendarViewTabs basePath={BASE_PATH} year={year} month={month} view={view} />;

  if (view === "schedule") {
    const [{ data: schedules, error }, { data: shiftTypes }] = await Promise.all([
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

    if (error) {
      console.error("Failed to load calendar schedules:", error);
    }

    const events: ScheduleEvent[] = ((schedules ?? []) as unknown as ScheduleRow[]).map((r) => ({
      id: r.id,
      date: r.date,
      color: r.shift_type?.color ?? "blue",
      label: `${r.user_id === user?.profile.id ? "You" : r.profile?.full_name} · ${r.shift_type?.name}`,
    }));

    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {tabs}
          <Link
            href="/admin/schedule/new"
            className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
          >
            + Assign Schedule
          </Link>
        </div>
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

  const { data: requests, error } = await supabase
    .from("leave_requests")
    .select(
      "id, user_id, start_date, end_date, status, " +
        "profile:profiles!leave_requests_user_id_fkey(full_name), " +
        "leave_type:leave_types(name)",
    )
    .in("status", ["pending", "approved"])
    .lte("start_date", endISO)
    .gte("end_date", startISO);

  if (error) {
    console.error("Failed to load calendar leave requests:", error);
  }

  const events: CalendarEvent[] = ((requests ?? []) as unknown as RequestRow[]).map((r) => ({
    id: r.id,
    start_date: r.start_date,
    end_date: r.end_date,
    status: r.status,
    mine: r.user_id === user?.profile.id,
    label: `${r.profile?.full_name} · ${r.leave_type?.name}${r.status === "pending" ? " (pending)" : ""}`,
  }));

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
