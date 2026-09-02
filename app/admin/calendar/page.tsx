import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  addDaysISO,
  getMonthRange,
  resolveWeekStart,
  resolveYearMonth,
  toISODate,
} from "@/lib/calendar-utils";
import { LeaveCalendar, type CalendarEvent } from "@/components/leave-calendar";
import { ScheduleCalendar, type ScheduleEvent } from "@/components/schedule-calendar";
import { SubmitButton } from "@/components/submit-button";
import { updateSchedule, deleteSchedule } from "@/app/admin/schedule/actions";
import type { ShiftColor } from "@/lib/types";

type LeaveRow = {
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
  shift_type_id: string;
  notes: string | null;
  profile: { full_name: string } | null;
  shift_type: { name: string; color: ShiftColor } | null;
};

const BASE_PATH = "/admin/calendar";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; w?: string; q?: string; error?: string }>;
}) {
  const { y, m, w, q, error } = await searchParams;
  const { year, month } = resolveYearMonth(y, m);
  const { startISO: monthStartISO, endISO: monthEndISO } = getMonthRange(year, month);
  const weekStartISO = resolveWeekStart(w);
  const weekEndISO = addDaysISO(weekStartISO, 6);
  const redirectTo = `/admin/calendar?w=${weekStartISO}`;
  const todayISO = toISODate(new Date());
  const search = (q ?? "").trim().toLowerCase();

  const [user, supabase] = await Promise.all([getCurrentUser(), createClient()]);

  const [{ data: leaveRequests, error: leaveError }, { data: shiftTypes }, { data: schedules, error: scheduleError }] =
    await Promise.all([
      supabase
        .from("leave_requests")
        .select(
          "id, user_id, start_date, end_date, status, " +
            "profile:profiles!leave_requests_user_id_fkey(full_name), " +
            "leave_type:leave_types(name)",
        )
        .in("status", ["pending", "approved"])
        .lte("start_date", monthEndISO)
        .gte("end_date", monthStartISO),
      supabase.from("shift_types").select("id, name, color").eq("is_active", true).order("name"),
      supabase
        .from("schedules")
        .select(
          "id, date, user_id, shift_type_id, notes, " +
            "profile:profiles!schedules_user_id_fkey(full_name), " +
            "shift_type:shift_types(name, color)",
        )
        .gte("date", weekStartISO)
        .lte("date", weekEndISO)
        .order("date"),
    ]);

  if (leaveError) console.error("Failed to load calendar leave requests:", leaveError);
  if (scheduleError) console.error("Failed to load calendar schedules:", scheduleError);

  const leaveEvents: CalendarEvent[] = ((leaveRequests ?? []) as unknown as LeaveRow[]).map(
    (r) => ({
      id: r.id,
      start_date: r.start_date,
      end_date: r.end_date,
      status: r.status,
      mine: r.user_id === user?.profile.id,
      label: `${r.profile?.full_name} · ${r.leave_type?.name}${r.status === "pending" ? " (pending)" : ""}`,
    }),
  );

  const scheduleRows = (schedules ?? []) as unknown as ScheduleRow[];
  const scheduleEvents: ScheduleEvent[] = scheduleRows.map((r) => ({
    id: r.id,
    date: r.date,
    color: r.shift_type?.color ?? "blue",
    label: `${r.profile?.full_name} · ${r.shift_type?.name}`,
  }));

  const filteredRows = search
    ? scheduleRows.filter((r) => r.profile?.full_name?.toLowerCase().includes(search))
    : scheduleRows;

  // Grouped by day (rows already arrive date-sorted) so the date only has
  // to be shown once per group instead of repeated on every entry.
  const rowsByDate = new Map<string, ScheduleRow[]>();
  for (const r of filteredRows) {
    const list = rowsByDate.get(r.date) ?? [];
    list.push(r);
    rowsByDate.set(r.date, list);
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-lg font-semibold text-slate-900">Leave</h1>
        <div className="mt-3">
          <LeaveCalendar year={year} month={month} events={leaveEvents} basePath={BASE_PATH} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Schedule</h2>
          <Link
            href="/admin/schedule/new"
            className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
          >
            + Assign Schedule
          </Link>
        </div>

        {error && (
          <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-3">
          <ScheduleCalendar
            weekStartISO={weekStartISO}
            events={scheduleEvents}
            basePath={BASE_PATH}
            shiftLegend={shiftTypes ?? []}
          />
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-slate-700">This Week&apos;s Assignments</h3>
            <form method="get" className="flex items-center gap-2">
              <input type="hidden" name="w" value={weekStartISO} />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Search employee…"
                className="w-40 rounded-md border border-slate-300 px-2.5 py-1 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 sm:w-56"
              />
              {q && (
                <Link
                  href={`/admin/calendar?w=${weekStartISO}`}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>

          {scheduleRows.length === 0 ? (
            <p className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-400">
              No shifts assigned this week.
            </p>
          ) : rowsByDate.size === 0 ? (
            <p className="mt-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-400">
              No matches for &quot;{q}&quot; this week.
            </p>
          ) : (
            <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {[...rowsByDate.entries()].map(([date, rows]) => (
                <details
                  key={date}
                  name="week-schedule-day"
                  open={date === todayISO}
                  className="group border-b border-slate-100 last:border-b-0"
                >
                  <summary className="flex cursor-pointer items-center justify-between bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span>
                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      {rows.length} shift{rows.length === 1 ? "" : "s"}
                      <svg
                        className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </summary>
                  <div className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <form
                        key={r.id}
                        className="flex flex-wrap items-center gap-2 px-3 py-2"
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="redirect_to" value={redirectTo} />
                        <span className="min-w-28 flex-1 text-sm font-medium text-slate-800">
                          {r.profile?.full_name}
                        </span>
                        <select
                          name="shift_type_id"
                          aria-label="Shift"
                          defaultValue={r.shift_type_id}
                          className="rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                        >
                          {(shiftTypes ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          name="notes"
                          aria-label="Notes"
                          placeholder="Notes"
                          defaultValue={r.notes ?? ""}
                          className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 sm:w-36"
                        />
                        <SubmitButton
                          formAction={updateSchedule}
                          pendingText="Saving…"
                          className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          Save
                        </SubmitButton>
                        <SubmitButton
                          formAction={deleteSchedule}
                          pendingText="Removing…"
                          className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </SubmitButton>
                      </form>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
