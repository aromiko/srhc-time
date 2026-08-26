import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResponsiveTable, type Column } from "@/components/responsive-table";
import type { Profile } from "@/lib/types";

const columns: Column<Profile>[] = [
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
  {
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
  },
];

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  const employees = (profiles ?? []) as Profile[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Employees</h1>
        <Link
          href="/admin/employees/new"
          className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800"
        >
          + New Employee
        </Link>
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
