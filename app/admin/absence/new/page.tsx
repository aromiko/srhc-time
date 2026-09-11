import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { BackLink } from "@/components/back-link";
import { recordAbsence } from "./actions";

export default async function NewAbsencePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: employees } = await supabase.from("profiles").select("id, full_name").order("full_name");

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/calendar" label="Back to Calendar" />
      <h1 className="text-lg font-semibold text-slate-900">Record Absence</h1>
      <p className="mt-1 text-sm text-slate-500">
        For unauthorized absences only - this is not leave, doesn&apos;t touch anyone&apos;s
        leave balance, and needs no approval. It just shows up on the calendar for visibility.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form
        action={recordAbsence}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <div>
          <label htmlFor="user_id" className="block text-sm font-medium text-slate-700">
            Employee
          </label>
          <select
            id="user_id"
            name="user_id"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          >
            {(employees ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
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
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
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
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
            Reason (optional)
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </div>

        <p className="text-xs text-slate-400">
          Every day in the date range (inclusive) is recorded absent. Re-recording a day someone
          already has overwrites it (e.g. to update the reason).
        </p>

        <SubmitButton
          pendingText="Recording…"
          className="w-full justify-center rounded-md bg-brand-700 px-4 py-3 text-base font-medium text-white hover:bg-brand-800"
        >
          Record Absence
        </SubmitButton>
      </form>
    </div>
  );
}
