import { addDays, fromIsoDate, toIsoDate } from "@/lib/date";
import type { Recurrence } from "@/lib/data";

/** Compute the next occurrence date for a recurring task, given the date
    it was just completed (or the previous due_date). Returns ISO date. */
export function nextOccurrence(from: string, recurrence: Recurrence): string | null {
  if (!recurrence) return null;
  switch (recurrence) {
    case "daily":    return addDays(from, 1);
    case "weekly":   return addDays(from, 7);
    case "biweekly": return addDays(from, 14);
    case "monthly": {
      const d = fromIsoDate(from);
      d.setMonth(d.getMonth() + 1);
      return toIsoDate(d);
    }
  }
}

export const RECURRENCE_LABELS: Record<NonNullable<Recurrence>, string> = {
  daily:    "каждый день",
  weekly:   "каждую неделю",
  biweekly: "раз в 2 недели",
  monthly:  "каждый месяц",
};
