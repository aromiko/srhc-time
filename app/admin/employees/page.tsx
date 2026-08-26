import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

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
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Employee
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Name</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Role</th>
              <th className="px-4 py-2 text-right font-medium text-slate-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No employees yet.
                </td>
              </tr>
            )}
            {employees.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2 text-slate-800">{e.full_name}</td>
                <td className="px-4 py-2 capitalize text-slate-600">{e.role}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/employees/${e.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
