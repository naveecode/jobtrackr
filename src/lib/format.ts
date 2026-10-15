export function todayISO(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function monthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatApplied(isoDate: string, now = new Date()): string {
  if (!isoDate) return "";
  const then = Date.parse(`${isoDate}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((today - then) / 86_400_000);
  if (Number.isNaN(days)) return "";
  if (days <= 0) return "Applied today";
  if (days === 1) return "Applied yesterday";
  if (days < 45) return `Applied ${days}d ago`;
  return `Applied ${formatDate(isoDate)}`;
}

export function formatDue(iso: string, now = Date.now()): string {
  const due = Date.parse(iso);
  if (Number.isNaN(due)) return "";
  const diff = due - now;
  const day = 86_400_000;
  if (diff < -day) return `${Math.max(1, Math.round(-diff / day))}d overdue`;
  if (diff < 0) return "Overdue";
  if (diff < day) return "Due today";
  if (diff < 2 * day) return "Tomorrow";
  return new Date(due).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isOverdue(iso: string, now = Date.now()): boolean {
  const due = Date.parse(iso);
  return !Number.isNaN(due) && due < now;
}

/** Months before `now`, clamped to a real calendar day. UTC, so tests don't drift by timezone. */
export function monthsAgo(months: number, day: number, now = new Date()): string {
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1));
  const lastDay = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)).getUTCDate();
  cursor.setUTCDate(Math.min(day, lastDay));
  return cursor.toISOString().slice(0, 10);
}

export function daysFromNow(days: number, now = new Date()): string {
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}
