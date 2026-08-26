import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { HomeIcon, PlusCircleIcon, CalendarIcon } from "@/components/icons";

const TABS = [
  { href: "/dashboard", label: "My Leave", icon: <HomeIcon className="h-6 w-6" />, exact: true },
  {
    href: "/dashboard/leave/new",
    label: "File Leave",
    icon: <PlusCircleIcon className="h-6 w-6" />,
  },
  { href: "/dashboard/calendar", label: "Calendar", icon: <CalendarIcon className="h-6 w-6" /> },
];

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/logo.png"
              alt="Barangay Santa Rita seal"
              className="h-9 w-9 rounded-full"
            />
            <div>
              <p className="text-base leading-tight font-semibold text-slate-900">SRHC Time</p>
              <p className="hidden text-xs leading-tight text-slate-500 sm:block">
                {user.profile.full_name}
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              My Leave
            </Link>
            <Link
              href="/dashboard/leave/new"
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              File Leave
            </Link>
            <Link
              href="/dashboard/calendar"
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
