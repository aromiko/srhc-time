import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import type { LeaveBalance, LeaveType, Profile } from "@/lib/types";

type EmployeeRow = Profile & { remaining: Record<string, number> };

const baseColumns: Column<EmployeeRow>[] = [
  { key: "name", header: "Name", cell: (e) => e.full_name },
  {
    key: "mobile",
    header: "Mobile",
    cell: (e) =>
      e.mobile_number ? (
        <a href={`tel:${e.mobile_number}`} className="text-brand-700 hover:text-brand-800">
          {e.mobile_number}
        </a>
      ) : (
        <span className="text-slate-400">—</span>
      ),
  },
  { key: "role", header: "Role", cell: (e) => <span className="capitalize">{e.role}</span> },
];

const manageColumn: Column<EmployeeRow> = {
  key: "manage",
  header: "",
  align: "right",
  cell: (e) => (
    <Link
      href={`/admin/employees/${e.id}`}
      className="text-sm font-medium text-brand-700 hover:text-brand-800"
    >
      Manage
    </Link>
  ),
};

export default async function EmployeesPage() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: types }, { data: balances }] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name"),
    supabase.from("leave_types").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("leave_balances").select("user_id, leave_type_id, allocated_days, used_days"),
  ]);

  const leaveTypes = (types ?? []) as LeaveType[];
  const remainingByUser = new Map<string, Record<string, number>>();
  for (const b of (balances ?? []) as Omit<LeaveBalance, "id">[]) {
    const rec = remainingByUser.get(b.user_id) ?? {};
    rec[b.leave_type_id] = b.allocated_days - b.used_days;
    remainingByUser.set(b.user_id, rec);
  }

  const employees: EmployeeRow[] = ((profiles ?? []) as Profile[]).map((p) => ({
    ...p,
    remaining: remainingByUser.get(p.id) ?? {},
  }));

  const columns: Column<EmployeeRow>[] = [
    ...baseColumns,
    ...leaveTypes.map(
      (t): Column<EmployeeRow> => ({
        key: `bal-${t.id}`,
        header: t.name,
        align: "right",
        cell: (e) => {
          const n = e.remaining[t.id];
          if (n === undefined) return <span className="text-slate-400">—</span>;
          return <span className={n < 0 ? "text-red-600" : "tabular-nums"}>{n}</span>;
        },
      }),
    ),
    manageColumn,
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900">Employees</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/employees/batch"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Batch Add Balance
          </Link>
          <Link
            href="/admin/employees/new"
            className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
          >
            + New Employee
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <ResponsiveTable
          columns={columns}
          rows={employees}
          rowKey={(e) => e.id}
          emptyMessage="No employees yet."
        />
      </div>
    </div>
  );
}
