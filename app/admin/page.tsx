import { createClient } from "@/lib/supabase/server";
import { formatDate, nextBirthdayWithin } from "@/lib/leave-utils";
import { toISODate } from "@/lib/calendar-utils";
import { SubmitButton } from "@/components/submit-button";
import { StatTile } from "@/components/stat-tile";
import { displayName } from "@/lib/profile-utils";
import { approveRequest, declineRequest } from "./actions";

type PendingRequest = {
  id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  profile: { full_name: string } | null;
  leave_type: { name: string } | null;
};

type OnLeaveToday = {
  id: string;
  profile: { full_name: string; nickname: string | null } | null;
  leave_type: { name: string } | null;
};

type OnDutyToday = {
  id: string;
  profile: { full_name: string; nickname: string | null } | null;
  shift_type: { name: string } | null;
};

type BirthdayProfile = {
  id: string;
  full_name: string;
  birthday: string;
};

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const todayISO = toISODate(new Date());

  const [
    { data: requests, error: requestsError },
    { count: employeeCount },
    { data: onLeaveToday },
    { data: onDutyToday },
    { data: birthdayProfiles },
  ] = await Promise.all([
    supabase
      .from("leave_requests")
      .select(
        "id, start_date, end_date, days_requested, reason, profile:profiles!leave_requests_user_id_fkey(full_name), leave_type:leave_types(name)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("leave_requests")
      .select(
        "id, profile:profiles!leave_requests_user_id_fkey(full_name, nickname), leave_type:leave_types(name)",
      )
      .eq("status", "approved")
      .lte("start_date", todayISO)
      .gte("end_date", todayISO),
    supabase
      .from("schedules")
      .select(
        "id, profile:profiles!schedules_user_id_fkey(full_name, nickname), shift_type:shift_types(name)",
      )
      .eq("date", todayISO),
    supabase.from("profiles").select("id, full_name, birthday").not("birthday", "is", null),
  ]);

  if (requestsError) {
    console.error("Failed to load pending leave requests:", requestsError);
  }

  const pending = (requests ?? []) as unknown as PendingRequest[];
  const leaveToday = (onLeaveToday ?? []) as unknown as OnLeaveToday[];
  const dutyToday = (onDutyToday ?? []) as unknown as OnDutyToday[];

  const birthdaysThisWeek = ((birthdayProfiles ?? []) as unknown as BirthdayProfile[])
    .map((p) => ({ ...p, ...nextBirthdayWithin(p.birthday, 7) }))
    .filter((p) => p.withinRange)
    .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const hasTodayInfo = leaveToday.length > 0 || dutyToday.length > 0 || birthdaysThisWeek.length > 0;

  return (
    <div>
      <div className="flex gap-3">
        <StatTile label="Pending" value={pending.length} href="/admin/requests?status=pending" />
        <StatTile label="Employees" value={employeeCount ?? 0} href="/admin/employees" />
        <StatTile label="Out Today" value={leaveToday.length} href="/admin/calendar" />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Today, {todayLabel}</p>
        {!hasTodayInfo ? (
          <p className="mt-1 text-sm text-slate-400">Nothing notable today.</p>
        ) : (
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            {leaveToday.map((r) => (
              <p key={r.id}>
                🌴{" "}
                <span className="font-medium">{r.profile ? displayName(r.profile) : "—"}</span>{" "}
                is on {r.leave_type?.name} leave
              </p>
            ))}
            {dutyToday.map((r) => (
              <p key={r.id}>
                🕖{" "}
                <span className="font-medium">{r.profile ? displayName(r.profile) : "—"}</span>{" "}
                is on {r.shift_type?.name}
              </p>
            ))}
            {birthdaysThisWeek.map((p) => (
              <p key={p.id}>
                🎂 <span className="font-medium">{p.full_name}</span>&apos;s birthday
                {toISODate(p.nextOccurrence) === todayISO
                  ? " is today!"
                  : ` is ${p.nextOccurrence.toLocaleDateString("en-US", { weekday: "long" })}`}
              </p>
            ))}
          </div>
        )}
      </div>

      <h1 className="mt-8 text-lg font-semibold text-slate-900">Pending Leave Requests</h1>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {pending.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No pending requests. 🎉</p>
      ) : (
        <div className="mt-4 space-y-4">
          {pending.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{r.profile?.full_name}</p>
                  <p className="text-sm text-slate-600">
                    {r.leave_type?.name} · {formatDate(r.start_date)} -{" "}
                    {formatDate(r.end_date)} · {r.days_requested} day
                    {r.days_requested === 1 ? "" : "s"}
                  </p>
                  {r.reason && (
                    <p className="mt-1 text-sm text-slate-500">“{r.reason}”</p>
                  )}
                </div>
              </div>

              <form className="mt-3 flex flex-wrap items-end gap-3">
                <input type="hidden" name="request_id" value={r.id} />
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-500">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    name="admin_notes"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  />
                </div>
                <SubmitButton
                  formAction={approveRequest}
                  pendingText="Approving…"
                  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Approve
                </SubmitButton>
                <SubmitButton
                  formAction={declineRequest}
                  pendingText="Declining…"
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Decline
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
