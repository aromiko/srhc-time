import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getMonthRange, resolveYearMonth } from "@/lib/calendar-utils";
import { LeaveCalendar, type CalendarEvent } from "@/components/leave-calendar";

type RequestRow = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved";
  profile: { full_name: string } | null;
  leave_type: { name: string } | null;
};

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;
  const { year, month } = resolveYearMonth(y, m);
  const { startISO, endISO } = getMonthRange(year, month);

  const [user, supabase] = await Promise.all([getCurrentUser(), createClient()]);

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

  return <LeaveCalendar year={year} month={month} events={events} basePath="/admin/calendar" />;
}
