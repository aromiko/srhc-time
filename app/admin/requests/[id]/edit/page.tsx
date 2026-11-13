import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { BackLink } from "@/components/back-link";
import { LeaveDurationField } from "@/components/leave-duration-field";
import { StatusBadge } from "@/components/status-badge";
import { editRequest } from "../../actions";
import type { HalfDayPeriod, LeaveStatus } from "@/lib/types";
import { formatDays } from "@/lib/leave-utils";

type RequestRow = {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  half_day_period: HalfDayPeriod | null;
  reason: string | null;
  status: LeaveStatus;
  profile: { full_name: string } | null;
};

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

export default async function AdminEditLeaveRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { id } = await params;
  const { error, from } = await searchParams;
  // Opened from an employee page -> go back there instead of Leave History.
  const fromEmployee = from === "employee";
  const supabase = await createClient();

  const [{ data }, { data: leaveTypes }] = await Promise.all([
    supabase
      .from("leave_requests")
      .select(
        "id, user_id, leave_type_id, start_date, end_date, days_requested, half_day_period, reason, status, " +
          "profile:profiles!leave_requests_user_id_fkey(full_name)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("leave_types").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  const request = data as unknown as RequestRow | null;
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <BackLink
        href={fromEmployee ? `/admin/employees/${request.user_id}` : "/admin/requests"}
        label={fromEmployee ? "Back to Employee" : "Back to Leave History"}
      />
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900">Edit Leave</h1>
        <StatusBadge status={request.status} />
      </div>
      <p className="mt-1 text-sm text-slate-500">{request.profile?.full_name}</p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form
        action={editRequest}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <input type="hidden" name="request_id" value={request.id} />
        {fromEmployee && <input type="hidden" name="from" value="employee" />}

        <div>
          <label htmlFor="leave_type_id" className="block text-sm font-medium text-slate-700">
            Leave Type
          </label>
          <select
            id="leave_type_id"
            name="leave_type_id"
            required
            defaultValue={request.leave_type_id}
            className={inputClass}
          >
            {(leaveTypes ?? []).map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              defaultValue={request.start_date}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">
              End Date
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              defaultValue={request.end_date}
              className={inputClass}
            />
          </div>
        </div>

        <LeaveDurationField defaultPeriod={request.half_day_period} />

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
            Reason (optional)
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            defaultValue={request.reason ?? ""}
            className={inputClass}
          />
        </div>

        <p className="text-xs text-slate-400">
          Days are counted as weekdays (Mon-Fri) between the start and end dates, inclusive, or 0.5 for a half day.
          {request.status === "approved" &&
            ` This leave is approved, so the employee's balance is adjusted automatically - the current ${formatDays(request.days_requested, request.half_day_period).toLowerCase()} is returned and the new total is deducted from the selected leave type.`}
        </p>

        <SubmitButton
          pendingText="Saving…"
          className="w-full justify-center rounded-md bg-brand-700 px-4 py-3 text-base font-medium text-white hover:bg-brand-800"
        >
          Save Changes
        </SubmitButton>
      </form>
    </div>
  );
}
