import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getMonthRange, resolveYearMonth } from "@/lib/calendar-utils";
import { LeaveCalendar, type CalendarEvent } from "@/components/leave-calendar";

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

export default async function EmployeeCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { y, m } = await searchParams;
  const { year, month } = resolveYearMonth(y, m);
  const { startISO, endISO } = getMonthRange(year, month);

  const supabase = await createClient();

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
    <LeaveCalendar year={year} month={month} events={events} basePath="/dashboard/calendar" />
  );
}
