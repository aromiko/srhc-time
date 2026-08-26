import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { HomeIcon, UsersIcon, CalendarIcon, HistoryIcon } from "@/components/icons";

const TABS = [
  { href: "/admin", label: "Requests", icon: <HomeIcon className="h-6 w-6" />, exact: true },
  { href: "/admin/requests", label: "History", icon: <HistoryIcon className="h-6 w-6" /> },
  { href: "/admin/employees", label: "Employees", icon: <UsersIcon className="h-6 w-6" /> },
  { href: "/admin/calendar", label: "Calendar", icon: <CalendarIcon className="h-6 w-6" /> },
];

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/logo.png"
              alt="Barangay Santa Rita seal"
              className="h-9 w-9 rounded-full"
            />
            <div>
              <p className="text-base leading-tight font-semibold text-slate-900">
                SRHC Time <span className="text-sm font-normal text-slate-400">Admin</span>
              </p>
              <p className="hidden text-xs leading-tight text-slate-500 sm:block">
                {user.profile.full_name}
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              Requests
            </Link>
            <Link
              href="/admin/requests"
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              History
            </Link>
            <Link
              href="/admin/employees"
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              Employees
            </Link>
            <Link
              href="/admin/calendar"
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              Calendar
            </Link>
            <LogoutButton />
          </nav>
          <div className="md:hidden">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:py-8 md:pb-8">
        {children}
      </main>
      <MobileTabBar tabs={TABS} />
    </div>
  );
}
