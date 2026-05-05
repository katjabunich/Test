import { createClient } from "@/lib/supabase/server";
import { DEV_USER_ID } from "@/lib/constants";
import type { Sphere, Task, Habit, HabitLog } from "@/lib/data";
import { addDays, today } from "@/lib/date";

/* ──────────────── Spheres ──────────────── */

export async function fetchSpheres(): Promise<Sphere[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spheres")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .order("position", { ascending: true });
  if (error) {
    console.error("fetchSpheres:", error);
    return [];
  }
  return (data ?? []) as Sphere[];
}

/* ──────────────── Tasks ──────────────── */

export async function fetchTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .is("completed_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchTasks:", error);
    return [];
  }
  return (data ?? []) as Task[];
}

/** Tasks that should appear on the Today screen:
    overdue (due_date < today) OR due today OR do_today flagged. */
export async function fetchTodayTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const t = today();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .is("completed_at", null)
    .or(`due_date.lte.${t},do_today.eq.true`)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchTodayTasks:", error);
    return [];
  }
  return (data ?? []) as Task[];
}

/** Open tasks in the next N days (excluding today). */
export async function fetchUpcomingTasks(days = 7): Promise<Task[]> {
  const supabase = await createClient();
  const t = today();
  const end = addDays(t, days);
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .is("completed_at", null)
    .gt("due_date", t)
    .lte("due_date", end)
    .order("due_date", { ascending: true });
  if (error) {
    console.error("fetchUpcomingTasks:", error);
    return [];
  }
  return (data ?? []) as Task[];
}

/* ──────────────── Habits ──────────────── */

export async function fetchHabits(): Promise<Habit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .eq("archived", false)
    .order("position", { ascending: true });
  if (error) {
    console.error("fetchHabits:", error);
    return [];
  }
  return (data ?? []) as Habit[];
}

/** Logs for the last N days for all habits. */
export async function fetchRecentHabitLogs(days = 30): Promise<HabitLog[]> {
  const supabase = await createClient();
  const since = addDays(today(), -days);
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .gte("date", since)
    .order("date", { ascending: false });
  if (error) {
    console.error("fetchRecentHabitLogs:", error);
    return [];
  }
  return (data ?? []) as HabitLog[];
}
