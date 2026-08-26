import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/leave-utils";
import type { Profile } from "@/lib/types";
import { updateLeaveBalance } from "./actions";

type BalanceRow = {
  leave_type_id: string;
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
  leave_type: { name: string } | null;
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const [{ data: leaveTypes }, { data: balances }, { data: requests }] = await Promise.all([
    supabase.from("leave_types").select("id, name").order("name"),
    supabase
      .from("leave_balances")
      .select("leave_type_id, allocated_days, used_days, leave_type:leave_types(name)")
      .eq("user_id", id),
    supabase
      .from("leave_requests")
      .select(
        "id, start_date, end_date, days_requested, status, leave_type:leave_types(name)",
      )
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const balanceByType = new Map(
    ((balances ?? []) as unknown as BalanceRow[]).map((b) => [b.leave_type_id, b]),
  );
  const requestRows = (requests ?? []) as unknown as RequestRow[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {(profile as Profile).full_name}
        </h1>
        <p className="text-sm capitalize text-slate-500">{(profile as Profile).role}</p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Leave Balances</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-500">
                  Leave Type
                </th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">Used</th>
                <th className="px-4 py-2 text-right font-medium text-slate-500">
                  Allocated
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(leaveTypes ?? []).map((lt) => {
                const balance = balanceByType.get(lt.id);
                return (
                  <tr key={lt.id}>
                    <td className="px-4 py-2 text-slate-800">{lt.name}</td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {balance?.used_days ?? 0}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-600">
                      {balance?.allocated_days ?? 0}
                    </td>
                    <td className="px-4 py-2">
                      <form action={updateLeaveBalance} className="flex items-center gap-2">
                        <input type="hidden" name="user_id" value={id} />
                        <input type="hidden" name="leave_type_id" value={lt.id} />
                        <input
                          type="number"
                          name="allocated_days"
                          min={0}
                          step={0.5}
                          defaultValue={balance?.allocated_days ?? 0}
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Recent Requests</h2>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requestRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No requests yet.
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
