import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/admin" className="text-lg font-semibold text-slate-900">
              SRHC Time <span className="text-sm font-normal text-slate-400">Admin</span>
            </Link>
            <p className="text-xs text-slate-500">{user.profile.full_name}</p>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Requests
            </Link>
            <Link
              href="/admin/requests"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              History
            </Link>
            <Link
              href="/admin/employees"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Employees
            </Link>
            <Link
              href="/admin/calendar"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Calendar
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
