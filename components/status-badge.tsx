import type { LeaveStatus } from "@/lib/types";

const styles: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
