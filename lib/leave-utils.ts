/**
 * Counts weekdays (Mon-Fri) between two ISO date strings, inclusive.
 * No holiday calendar for v1 - just business days.
 */
export function countWeekdays(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Birthdays recur yearly, so this compares month/day only - finds this
 * year's occurrence, rolls to next year if it's already passed, and reports
 * whether that next occurrence falls within the next `days` days (handles
 * the December-to-January wraparound for free since it's just date math).
 */
export function nextBirthdayWithin(
  birthdayISO: string,
  days: number,
  from: Date = new Date(),
): { withinRange: boolean; nextOccurrence: Date } {
  const birthday = new Date(birthdayISO + "T00:00:00");
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  let occurrence = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  if (occurrence < today) {
    occurrence = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
  }

  const diffDays = Math.round((occurrence.getTime() - today.getTime()) / 86_400_000);
  return { withinRange: diffDays < days, nextOccurrence: occurrence };
}
