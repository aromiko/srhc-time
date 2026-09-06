import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { BackLink } from "@/components/back-link";
import { batchAddLeaveBalance } from "./actions";

export default async function BatchBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: leaveTypes }, { data: employees }] = await Promise.all([
    supabase.from("leave_types").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/admin/employees" label="Back to Employees" />
      <h1 className="text-lg font-semibold text-slate-900">Batch Add Leave Balance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Adds days on top of whatever each selected employee already has - it doesn&apos;t
        overwrite their balance. Use this for things like Offset Leave, where only some
        employees qualify.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form
        action={batchAddLeaveBalance}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="leave_type_id" className="block text-sm font-medium text-slate-700">
              Leave Type
            </label>
            <select
              id="leave_type_id"
              name="leave_type_id"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            >
              {(leaveTypes ?? []).map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
              Days to Add
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min={0.5}
              step={0.5}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium text-slate-700">Employees</p>
          <div className="mt-1 max-h-72 space-y-1 overflow-y-auto rounded-md border border-slate-300 p-2">
            {(employees ?? []).map((e) => (
              <label
                key={e.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="employee_ids"
                  value={e.id}
                  className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                />
                {e.full_name}
              </label>
            ))}
          </div>
        </div>

        <SubmitButton
          pendingText="Adding…"
          className="w-full justify-center rounded-md bg-brand-700 px-4 py-3 text-base font-medium text-white hover:bg-brand-800"
        >
          Add to Selected
        </SubmitButton>
      </form>
    </div>
  );
}
