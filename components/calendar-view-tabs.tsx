import Link from "next/link";

export function CalendarViewTabs({
  basePath,
  year,
  month,
  view,
}: {
  basePath: string;
  year: number;
  month: number;
  view: "leave" | "schedule";
}) {
  const tabs = [
    { key: "leave" as const, label: "Leave" },
    { key: "schedule" as const, label: "Schedule" },
  ];

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${basePath}?y=${year}&m=${month}&view=${tab.key}`}
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            view === tab.key
              ? "bg-slate-900 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
