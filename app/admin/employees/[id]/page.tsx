import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { formatDate } from "@/lib/leave-utils";
import type { Profile } from "@/lib/types";
import { updateLeaveBalance, updateProfile } from "./actions";

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

type BalanceViewRow = {
  leaveTypeId: string;
  name: string;
  allocated: number;
  used: number;
};

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
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

  const balanceViewRows: BalanceViewRow[] = (leaveTypes ?? []).map((lt) => {
    const balance = balanceByType.get(lt.id);
    return {
      leaveTypeId: lt.id,
      name: lt.name,
      allocated: balance?.allocated_days ?? 0,
      used: balance?.used_days ?? 0,
    };
  });

  const balanceColumns: Column<BalanceViewRow>[] = [
    { key: "type", header: "Leave Type", cell: (b) => b.name },
    { key: "used", header: "Used", align: "right", cell: (b) => b.used },
    { key: "allocated", header: "Allocated", align: "right", cell: (b) => b.allocated },
    {
      key: "action",
      header: "",
      cell: (b) => (
        <form action={updateLeaveBalance} className="flex items-center justify-end gap-2">
          <input type="hidden" name="user_id" value={id} />
          <input type="hidden" name="leave_type_id" value={b.leaveTypeId} />
          <input
            type="number"
            name="allocated_days"
            min={0}
            step={0.5}
            defaultValue={b.allocated}
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            Save
          </button>
        </form>
      ),
    },
  ];

  const requestColumns: Column<RequestRow>[] = [
    { key: "type", header: "Type", cell: (r) => r.leave_type?.name },
    {
      key: "dates",
      header: "Dates",
      cell: (r) => `${formatDate(r.start_date)} - ${formatDate(r.end_date)}`,
    },
    { key: "days", header: "Days", align: "right", cell: (r) => r.days_requested },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const p = profile as Profile;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{p.full_name}</h1>
        <p className="text-sm capitalize text-slate-500">{p.role}</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <section>
        <h2 className="text-base font-semibold text-slate-900">Profile</h2>
        <form
          action={updateProfile}
          className="mt-3 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3"
        >
          <input type="hidden" name="user_id" value={id} />
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={p.full_name}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div>
            <label htmlFor="mobile_number" className="block text-sm font-medium text-slate-700">
              Mobile Number
            </label>
            <input
              id="mobile_number"
              name="mobile_number"
              type="tel"
              defaultValue={p.mobile_number ?? ""}
              placeholder="09XX XXX XXXX"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-slate-700">
              Birthday
            </label>
            <input
              id="birthday"
              name="birthday"
              type="date"
              defaultValue={p.birthday ?? ""}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-base shadow-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
            >
              Save Profile
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Leave Balances</h2>
        <div className="mt-3">
          <ResponsiveTable
            columns={balanceColumns}
            rows={balanceViewRows}
            rowKey={(b) => b.leaveTypeId}
            emptyMessage="No leave types configured."
          />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Recent Requests</h2>
        <div className="mt-3">
          <ResponsiveTable
            columns={requestColumns}
            rows={requestRows}
            rowKey={(r) => r.id}
            emptyMessage="No requests yet."
          />
        </div>
      </section>
    </div>
  );
}
