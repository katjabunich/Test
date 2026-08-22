import type { Habit, HabitLog } from "@/lib/data";
import { addDays, dow, today } from "@/lib/date";

/** Whether a habit's schedule asks for it to be done on the given date. */
export function isScheduledOn(habit: Habit, isoDate: string): boolean {
  switch (habit.schedule_type) {
    case "daily":
      return true;
    case "weekdays": {
      const days = (habit.schedule_value as { days?: number[] } | null)?.days ?? [];
      return days.includes(dow(isoDate));
    }
    case "n_per_week":
      // No fixed days — every day is a valid candidate; counts toward weekly goal.
      return true;
  }
}

export function isScheduledToday(habit: Habit): boolean {
  return isScheduledOn(habit, today());
}

/** Group logs by habit_id, sorted by date desc. */
export function groupLogsByHabit(logs: HabitLog[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!m.has(log.habit_id)) m.set(log.habit_id, new Set());
    m.get(log.habit_id)!.add(log.date);
  }
  return m;
}

/** Current streak of consecutive scheduled days that were logged, ending today
    or yesterday. A non-scheduled day doesn't break the streak. */
export function computeStreak(habit: Habit, logged: Set<string>): number {
  let streak = 0;
  let cursor = today();
  // If today isn't done yet, start from yesterday so we don't penalize "still doable today".
  if (!logged.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  /* Iteration cap, not just a streak cap: a habit that is never scheduled
     (e.g. schedule_type "weekdays" with an empty/null days list) keeps
     streak at 0 forever, so a `streak > 365` check alone never fires and
     the loop spins the server at 100% CPU. Seen in the wild via a mock
     habit; cheap to guard against for real data too. */
  for (let i = 0; i < 400; i++) {
    if (isScheduledOn(habit, cursor)) {
      if (logged.has(cursor)) {
        streak += 1;
        cursor = addDays(cursor, -1);
      } else {
        break;
      }
    } else {
      cursor = addDays(cursor, -1);
    }
    if (streak > 365) break; // safety
  }
  return streak;
}

/** Last N days, oldest first. */
export function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(addDays(today(), -i));
  }
  return out;
}

export const SCHEDULE_LABELS: Record<Habit["schedule_type"], string> = {
  daily: "каждый день",
  weekdays: "по дням недели",
  n_per_week: "несколько раз в неделю",
};

export const WEEKDAY_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
