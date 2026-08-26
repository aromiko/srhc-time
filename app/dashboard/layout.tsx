import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
              SRHC Time
            </Link>
            <p className="text-xs text-slate-500">{user.profile.full_name}</p>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              My Leave
            </Link>
            <Link
              href="/dashboard/leave/new"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              File Leave
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
