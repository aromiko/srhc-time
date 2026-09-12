import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/leave-utils";
import { cancelLeaveRequest } from "./leave/actions";

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

const balanceColumns: Column<BalanceRow>[] = [
  {
    key: "type",
    header: "Leave Type",
    cell: (b) => <span className="font-medium text-slate-800">{b.leave_type?.name}</span>,
  },
  {
    key: "allocated",
    header: "Allocated",
    align: "right",
    cell: (b) => <span className="text-slate-500">{b.allocated_days}</span>,
  },
  {
    key: "used",
    header: "Used",
    align: "right",
    cell: (b) => <span className="text-slate-500">{b.used_days}</span>,
  },
  {
    key: "remaining",
    header: "Remaining",
    align: "right",
    // The number employees actually care about at a glance - stands out
    // clearly from Allocated/Used instead of matching their weight.
    cell: (b) => (
      <span className="text-base font-bold text-brand-700">
        {b.allocated_days - b.used_days}
      </span>
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
  {
    key: "notes",
    header: "Notes",
    cell: (r) => r.admin_notes ?? "—",
    hideOnMobile: true,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    cell: (r) =>
      r.status === "pending" ? (
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/dashboard/leave/${r.id}/edit`}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Edit
          </Link>
          <form action={cancelLeaveRequest}>
            <input type="hidden" name="id" value={r.id} />
            <SubmitButton
              pendingText="Cancelling…"
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Cancel
            </SubmitButton>
          </form>
        </div>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
];

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
        <div className="mt-3">
          <ResponsiveTable
            columns={balanceColumns}
            rows={balanceRows}
            rowKey={(b) => b.id}
            emptyMessage="No leave balances set yet. Contact your administrator."
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">My Requests</h2>
          <Link
            href="/dashboard/leave/new"
            className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
          >
            File Leave
          </Link>
        </div>
        <div className="mt-3">
          <ResponsiveTable
            columns={requestColumns}
            rows={requestRows}
            rowKey={(r) => r.id}
            emptyMessage="No leave requests yet."
          />
        </div>
      </section>
    </div>
  );
}
