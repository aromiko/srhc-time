export type CalendarDay = {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
};

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Builds a full weeks-of-cells grid (including leading/trailing days) for a given 1-12 month. */
export function getMonthMatrix(year: number, month: number): CalendarDay[][] {
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = first.getDay();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const todayIso = toISODate(new Date());
  const cursor = new Date(year, month - 1, 1 - startWeekday);

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i % 7 === 0) weeks.push([]);
    const iso = toISODate(cursor);
    weeks[weeks.length - 1].push({
      date: new Date(cursor),
      iso,
      inMonth: cursor.getMonth() === month - 1,
      isToday: iso === todayIso,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return weeks;
}

export function getMonthRange(year: number, month: number): { startISO: string; endISO: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { startISO: toISODate(start), endISO: toISODate(end) };
}

/** Clamps arbitrary ?y=&m= search params to a valid {year, month}, defaulting to today. */
export function resolveYearMonth(y?: string, m?: string): { year: number; month: number } {
  const now = new Date();
  const year = Number(y) || now.getFullYear();
  const month = Math.min(12, Math.max(1, Number(m) || now.getMonth() + 1));
  return { year, month };
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** Resolves an arbitrary ?w= (any ISO date within the target week) to that week's Sunday. */
export function resolveWeekStart(w?: string): string {
  const parsed = w ? new Date(w + "T00:00:00") : new Date();
  const base = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return toISODate(startOfWeek(base));
}

/** The 7 days (Sun-Sat) of the week starting at weekStartISO. */
export function getWeekDays(weekStartISO: string): CalendarDay[] {
  const start = new Date(weekStartISO + "T00:00:00");
  const todayIso = toISODate(new Date());
  const days: CalendarDay[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = toISODate(date);
    days.push({ date, iso, inMonth: true, isToday: iso === todayIso });
  }
  return days;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function formatWeekRange(weekStartISO: string): string {
  const days = getWeekDays(weekStartISO);
  const start = days[0].date;
  const end = days[6].date;
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: withYear ? "numeric" : undefined,
    });
  return `${fmt(start, start.getFullYear() !== end.getFullYear())} - ${fmt(end, true)}`;
}
