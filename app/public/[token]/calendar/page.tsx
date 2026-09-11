import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMonthRange, resolveWeekStart, resolveYearMonth, addDaysISO } from "@/lib/calendar-utils";
import { LeaveCalendar, type CalendarEvent } from "@/components/leave-calendar";
import { ScheduleCalendar, type ScheduleEvent } from "@/components/schedule-calendar";
import { displayName } from "@/lib/profile-utils";
import { leaveTypeAbbr } from "@/lib/leave-utils";
import type { ShiftColor } from "@/lib/types";

type LeaveRow = {
  id: string;
  start_date: string;
  end_date: string;
  profile: { full_name: string; nickname: string | null } | null;
  leave_type: { name: string; sort_order: number } | null;
};

type AbsenceRow = {
  id: string;
  date: string;
  profile: { full_name: string; nickname: string | null } | null;
};

type ScheduleRow = {
  id: string;
  date: string;
  notes: string | null;
  profile: { full_name: string; nickname: string | null } | null;
  shift_type: { name: string; color: ShiftColor; sort_order: number } | null;
};

const ABSENCE_GROUP_LABEL = "ABSENCES";
const ABSENCE_SORT_ORDER = 999;

export default async function PublicCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ y?: string; m?: string; w?: string }>;
}) {
  const { token } = await params;
  const expected = process.env.PUBLIC_CALENDAR_TOKEN;

  // 404, not 403 - doesn't confirm or deny anything about the token to
  // someone guessing at it.
  if (!expected || token !== expected) {
    notFound();
  }

  const basePath = `/public/${token}/calendar`;

  const { y, m, w } = await searchParams;
  const { year, month } = resolveYearMonth(y, m);
  const { startISO: monthStartISO, endISO: monthEndISO } = getMonthRange(year, month);
  const weekStartISO = resolveWeekStart(w);
  const weekEndISO = addDaysISO(weekStartISO, 6);

  // Service-role client: there's no visitor session to key RLS off of here -
  // the token check above is what gates access to this page, not RLS. This
  // client and key never reach the browser; only the rendered HTML does.
  const admin = createAdminClient();

  const [{ data: leaveRequests }, { data: absences }, { data: schedules }, { data: shiftTypes }] =
    await Promise.all([
      admin
        .from("leave_requests")
        .select(
          "id, start_date, end_date, " +
            "profile:profiles!leave_requests_user_id_fkey(full_name, nickname), " +
            "leave_type:leave_types(name, sort_order)",
        )
        .eq("status", "approved")
        .lte("start_date", monthEndISO)
        .gte("end_date", monthStartISO),
      admin
        .from("absences")
        .select(
          "id, date, profile:profiles!absences_user_id_fkey(full_name, nickname)",
        )
        .gte("date", monthStartISO)
        .lte("date", monthEndISO),
      admin
        .from("schedules")
        .select(
          "id, date, notes, " +
            "profile:profiles!schedules_user_id_fkey(full_name, nickname), " +
            "shift_type:shift_types(name, color, sort_order)",
        )
        .gte("date", weekStartISO)
        .lte("date", weekEndISO)
        .order("date"),
      admin
        .from("shift_types")
        .select("name, color")
        .eq("is_active", true)
        .order("sort_order"),
    ]);

  const leaveEvents: CalendarEvent[] = [
    ...((leaveRequests ?? []) as unknown as LeaveRow[]).map((r) => ({
      id: r.id,
      start_date: r.start_date,
      end_date: r.end_date,
      status: "approved" as const,
      mine: false,
      label: r.profile ? displayName(r.profile) : "—",
      groupLabel: leaveTypeAbbr(r.leave_type?.name ?? ""),
      sortOrder: r.leave_type?.sort_order ?? 998,
    })),
    ...((absences ?? []) as unknown as AbsenceRow[]).map((a) => ({
      id: a.id,
      start_date: a.date,
      end_date: a.date,
      status: "absent" as const,
      mine: false,
      label: a.profile ? displayName(a.profile) : "—",
      groupLabel: ABSENCE_GROUP_LABEL,
      sortOrder: ABSENCE_SORT_ORDER,
    })),
  ];

  const scheduleEvents: ScheduleEvent[] = ((schedules ?? []) as unknown as ScheduleRow[]).map(
    (r) => ({
      id: r.id,
      date: r.date,
      color: r.shift_type?.color ?? "blue",
      label: r.profile ? displayName(r.profile) : "—",
      groupLabel: r.shift_type?.name ?? "",
      sortOrder: r.shift_type?.sort_order ?? 999,
      note: r.notes,
    }),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo.png"
            alt="Barangay Santa Rita seal"
            className="h-9 w-9 rounded-full"
          />
          <div>
            <p className="text-base leading-tight font-semibold text-slate-900">SRHC Time</p>
            <p className="text-xs leading-tight text-slate-500">Public Calendar · View Only</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8">
        <section>
          <h1 className="text-lg font-semibold text-slate-900">Leave and Absences</h1>
          <div className="mt-3">
            <LeaveCalendar year={year} month={month} events={leaveEvents} basePath={basePath} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Schedule</h2>
          <div className="mt-3">
            <ScheduleCalendar
              weekStartISO={weekStartISO}
              events={scheduleEvents}
              basePath={basePath}
              shiftLegend={shiftTypes ?? []}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
