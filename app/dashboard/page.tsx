import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/leave-utils";

type BalanceRow = {
  id: string;
  allocated_days: number;
  used_days: number;
  leave_type: { name: string } | null;
};

type RequestRow = {
  id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: "pending" | "approved" | "declined";
  reason: string | null;
  admin_notes: string | null;
  leave_type: { name: string } | null;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: balances }, { data: requests }] = await Promise.all([
    supabase
      .from("leave_balances")
      .select("id, allocated_days, used_days, leave_type:leave_types(name)")
      .eq("user_id", user.profile.id)
      .order("id"),
    supabase
      .from("leave_requests")
      .select(
        "id, start_date, end_date, days_requested, status, reason, admin_notes, leave_type:leave_types(name)",
      )
      .eq("user_id", user.profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const balanceRows = (balances ?? []) as unknown as BalanceRow[];
  const requestRows = (requests ?? []) as unknown as RequestRow[];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-lg font-semibold text-slate-900">Leave Balances</h1>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">
                  Leave Type
                </th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">
                  Allocated
                </th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">
                  Used
                </th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balanceRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No leave balances set yet. Contact your administrator.
                  </td>
                </tr>
              )}
              {balanceRows.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 text-slate-800">{b.leave_type?.name}</td>
                  <td className="px-4 py-2 text-right text-slate-600">
                    {b.allocated_days}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">{b.used_days}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">
                    {b.allocated_days - b.used_days}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">My Requests</h2>
          <Link
            href="/dashboard/leave/new"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            File Leave
          </Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Type</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Dates</th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">Days</th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-500">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requestRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No leave requests yet.
                  </td>
                </tr>
              )}
              {requestRows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-slate-800">{r.leave_type?.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {formatDate(r.start_date)} - {formatDate(r.end_date)}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">
                    {r.days_requested}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2 text-slate-500">{r.admin_notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
