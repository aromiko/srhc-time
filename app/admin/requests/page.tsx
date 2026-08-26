import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/leave-utils";
import { StatusBadge } from "@/components/status-badge";
import { updateRequestStatus } from "./actions";
import type { LeaveStatus } from "@/lib/types";

type RequestRow = {
  id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string | null;
  status: LeaveStatus;
  admin_notes: string | null;
  profile: { full_name: string } | null;
  leave_type: { name: string } | null;
  reviewer: { full_name: string } | null;
};

const FILTERS = ["all", "pending", "approved", "declined"] as const;
type Filter = (typeof FILTERS)[number];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const { status, error } = await searchParams;
  const filter: Filter = FILTERS.includes(status as Filter) ? (status as Filter) : "all";

  const supabase = await createClient();
  let query = supabase
    .from("leave_requests")
    .select(
      "id, start_date, end_date, days_requested, reason, status, admin_notes, " +
        "profile:profiles!leave_requests_user_id_fkey(full_name), " +
        "leave_type:leave_types(name), " +
        "reviewer:profiles!leave_requests_reviewed_by_fkey(full_name)",
    )
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data: requests, error: requestsError } = await query;
  if (requestsError) {
    console.error("Failed to load leave request history:", requestsError);
  }

  const rows = (requests ?? []) as unknown as RequestRow[];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Leave History</h1>

      <div className="mt-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/requests" : `/admin/requests?status=${f}`}
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
              filter === f
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-4 space-y-4">
        {rows.length === 0 && <p className="text-sm text-slate-500">No requests found.</p>}

        {rows.map((r) => (
          <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{r.profile?.full_name}</p>
                <p className="text-sm text-slate-600">
                  {r.leave_type?.name} · {formatDate(r.start_date)} - {formatDate(r.end_date)} ·{" "}
                  {r.days_requested} day{r.days_requested === 1 ? "" : "s"}
                </p>
                {r.reason && <p className="mt-1 text-sm text-slate-500">“{r.reason}”</p>}
                {r.reviewer && (
                  <p className="mt-1 text-xs text-slate-400">
                    Last reviewed by {r.reviewer.full_name}
                  </p>
                )}
              </div>
              <StatusBadge status={r.status} />
            </div>

            <form className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="request_id" value={r.id} />
              <div>
                <label className="block text-xs font-medium text-slate-500">Status</label>
                <select
                  name="status"
                  defaultValue={r.status}
                  className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div className="min-w-50 flex-1">
                <label className="block text-xs font-medium text-slate-500">
                  Note (optional)
                </label>
                <input
                  type="text"
                  name="admin_notes"
                  defaultValue={r.admin_notes ?? ""}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                formAction={updateRequestStatus}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                Save
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
