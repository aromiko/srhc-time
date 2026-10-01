import { SubmitButton } from "@/components/submit-button";
import { BackLink } from "@/components/back-link";
import { createCalendarEvent } from "./actions";

const inputClasses =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/calendar" label="Back to Calendar" />
      <h1 className="text-lg font-semibold text-slate-900">Add Event</h1>
      <p className="mt-1 text-sm text-slate-500">
        For conventions, holidays, and other company-wide dates. It shows up on everyone&apos;s
        calendar and doesn&apos;t affect anyone&apos;s leave.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form
        action={createCalendarEvent}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Annual Convention, Independence Day"
            className={inputClasses}
          />
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
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">
              End Date (optional)
            </label>
            <input id="end_date" name="end_date" type="date" className={inputClasses} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            Notes (optional)
          </label>
          <input id="notes" name="notes" type="text" className={inputClasses} />
        </div>

        <p className="text-xs text-slate-400">Leave the end date empty for a single-day event.</p>

        <SubmitButton
          pendingText="Adding…"
          className="w-full justify-center rounded-md bg-brand-700 px-4 py-3 text-base font-medium text-white hover:bg-brand-800"
        >
          Add Event
        </SubmitButton>
      </form>
    </div>
  );
}
