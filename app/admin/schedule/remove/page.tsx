import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { BackLink } from "@/components/back-link";
import { eachDateISO } from "@/lib/calendar-utils";
import { formatDate } from "@/lib/leave-utils";
import { displayName } from "@/lib/profile-utils";
import { removeSchedules } from "./actions";

type MatchRow = {
  id: string;
  date: string;
  notes: string | null;
  shift_type: { name: string } | null;
};

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

/**
 * Two-step bulk removal: the filter form submits as a GET back to this page
 * to preview exactly which shifts match, then a separate confirm form runs
 * the delete. Nothing is removed until the admin has seen the list.
 */
export default async function RemoveSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{
    user_id?: string;
    shift_type_id?: string;
    start_date?: string;
    end_date?: string;
    error?: string;
  }>;
}) {
  const {
    user_id: userId = "",
    shift_type_id: shiftTypeId = "",
    start_date: startDate = "",
    end_date: endDate = "",
    error,
  } = await searchParams;
  const supabase = await createClient();

  const [{ data: employees }, { data: shiftTypes }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, nickname").order("full_name"),
    supabase.from("shift_types").select("id, name").order("sort_order"),
  ]);

  const hasFilters = Boolean(userId && startDate && endDate);
  const validRange = eachDateISO(startDate, endDate).length > 0;

  let matches: MatchRow[] = [];
  let previewError: string | null = null;
  if (hasFilters && validRange) {
    let query = supabase
      .from("schedules")
      .select("id, date, notes, shift_type:shift_types(name)")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");
    if (shiftTypeId) query = query.eq("shift_type_id", shiftTypeId);
    const { data, error: queryError } = await query;
    if (queryError) previewError = queryError.message;
    matches = (data ?? []) as unknown as MatchRow[];
  } else if (hasFilters) {
    previewError = "End date must be on or after the start date.";
  }

  const employee = (employees ?? []).find((e) => e.id === userId);
  const employeeName = employee ? displayName(employee) : "this employee";
  const shiftName = (shiftTypes ?? []).find((s) => s.id === shiftTypeId)?.name;
  const summary =
    matches.length > 0
      ? `${matches.length} ${shiftName ? `${shiftName} ` : ""}shift${
          matches.length === 1 ? "" : "s"
        } for ${employeeName} (${formatDate(startDate)} – ${formatDate(endDate)})`
      : "";

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/calendar#schedule" label="Back to Calendar" />
      <h1 className="text-lg font-semibold text-slate-900">Remove Schedules</h1>
      <p className="mt-1 text-sm text-slate-500">
        Clear an employee&apos;s shifts across a date range, e.g. to undo a mistaken assignment.
      </p>

      {(error || previewError) && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || previewError}
        </div>
      )}

      <form method="get" className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label htmlFor="user_id" className="block text-sm font-medium text-slate-700">
            Employee
          </label>
          <select id="user_id" name="user_id" required defaultValue={userId} className={inputClass}>
            {(employees ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="shift_type_id" className="block text-sm font-medium text-slate-700">
            Shift
          </label>
          <select
            id="shift_type_id"
            name="shift_type_id"
            defaultValue={shiftTypeId}
            className={inputClass}
          >
            <option value="">All shifts</option>
            {(shiftTypes ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
              defaultValue={startDate}
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
              defaultValue={endDate}
              className={inputClass}
            />
          </div>
        </div>

        <SubmitButton
          pendingText="Finding…"
          className="w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
        >
          Preview Shifts to Remove
        </SubmitButton>
      </form>

      {hasFilters && validRange && !previewError && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          {matches.length === 0 ? (
            <p className="text-sm text-slate-500">No matching shifts found in that range.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-900">{summary} will be removed:</p>
              <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-100 text-sm">
                {matches.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <span className="text-slate-500">{formatDate(m.date)}</span>
                    <span className="text-right text-slate-800">
                      {m.shift_type?.name ?? "—"}
                      {m.notes ? <span className="text-slate-400"> — {m.notes}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>

              <form action={removeSchedules} className="mt-4">
                <input type="hidden" name="user_id" value={userId} />
                <input type="hidden" name="shift_type_id" value={shiftTypeId} />
                <input type="hidden" name="start_date" value={startDate} />
                <input type="hidden" name="end_date" value={endDate} />
                <SubmitButton
                  pendingText="Removing…"
                  confirmMessage={`Remove ${summary}? This can't be undone.`}
                  className="w-full justify-center rounded-md bg-red-600 px-4 py-3 text-base font-medium text-white hover:bg-red-700"
                >
                  Remove {matches.length} Shift{matches.length === 1 ? "" : "s"}
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
