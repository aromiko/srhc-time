import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/leave-utils";
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

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: requests, error: requestsError } = await supabase
    .from("leave_requests")
    .select(
      "id, start_date, end_date, days_requested, reason, profile:profiles!leave_requests_user_id_fkey(full_name), leave_type:leave_types(name)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (requestsError) {
    console.error("Failed to load pending leave requests:", requestsError);
  }

  const pending = (requests ?? []) as unknown as PendingRequest[];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Pending Leave Requests</h1>

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
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  formAction={approveRequest}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  type="submit"
                  formAction={declineRequest}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Decline
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
