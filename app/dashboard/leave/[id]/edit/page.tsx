import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { BackLink } from "@/components/back-link";
import { updateLeaveRequest } from "../../actions";

export default async function EditLeaveRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: request }, { data: leaveTypes }, { data: balances }] = await Promise.all([
    supabase
      .from("leave_requests")
      .select("id, user_id, leave_type_id, start_date, end_date, reason, status")
      .eq("id", id)
      .single(),
    supabase.from("leave_types").select("id, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("leave_balances")
      .select("leave_type_id, allocated_days, used_days")
      .eq("user_id", user.profile.id),
  ]);

  // Only the owner can edit it, and only while it's still pending - once
  // reviewed, admin owns any further changes.
  if (!request || request.user_id !== user.profile.id || request.status !== "pending") {
    notFound();
  }

  const remainingByType = new Map(
    (balances ?? []).map((b) => [b.leave_type_id, b.allocated_days - b.used_days]),
  );

  return (
    <div className="mx-auto max-w-lg">
      <BackLink href="/dashboard" label="Back to My Leave" />
      <h1 className="text-lg font-semibold text-slate-900">Edit Leave Request</h1>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form
        action={updateLeaveRequest}
        className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <input type="hidden" name="id" value={request.id} />

        <div>
          <label htmlFor="leave_type_id" className="block text-sm font-medium text-slate-700">
            Leave Type
          </label>
          <select
            id="leave_type_id"
            name="leave_type_id"
            required
            defaultValue={request.leave_type_id}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          >
            {(leaveTypes ?? []).map((lt) => {
              const remaining = remainingByType.get(lt.id) ?? 0;
              return (
                <option key={lt.id} value={lt.id}>
                  {lt.name} — {remaining} day{remaining === 1 ? "" : "s"} left
                </option>
              );
            })}
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
              defaultValue={request.end_date}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
            Reason (optional)
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            defaultValue={request.reason ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
        </div>

        <p className="text-xs text-slate-400">
          Days requested are counted as weekdays (Mon-Fri) between the start and end dates,
          inclusive. Only pending requests can be edited.
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
