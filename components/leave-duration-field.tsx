import type { HalfDayPeriod } from "@/lib/types";

/**
 * Full day / Half day (AM) / Half day (PM) picker shared by every leave form.
 * A half day is only valid for a single-day leave (start date = end date) and
 * counts as 0.5 - see validateLeaveDateRange in lib/leave-utils.ts.
 */
export function LeaveDurationField({
  defaultPeriod = null,
}: {
  defaultPeriod?: HalfDayPeriod | null;
}) {
  return (
    <div>
      <label htmlFor="duration" className="block text-sm font-medium text-slate-700">
        Duration
      </label>
      <select
        id="duration"
        name="duration"
        defaultValue={defaultPeriod ?? "full"}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
      >
        <option value="full">Full day</option>
        <option value="am">Half day - AM (single date only)</option>
        <option value="pm">Half day - PM (single date only)</option>
      </select>
    </div>
  );
}
