import Link from "next/link";
import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  href,
}: {
  label: string;
  value: ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </>
  );

  const className =
    "flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-center transition-colors" +
    (href ? " hover:border-brand-300 hover:bg-brand-50" : "");

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
