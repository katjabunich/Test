import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { Sphere, Task, Habit, HabitLog } from "@/lib/data";
import { addDays, today } from "@/lib/date";

/* All reads rely on RLS for tenant isolation; the explicit user_id filter
   is kept where it lets Postgres use the (user_id, …) index. habit_logs
   has no user_id column — RLS does an EXISTS join through habits. */

/* ──────────────── Spheres ──────────────── */

export async function fetchSpheres(): Promise<Sphere[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spheres")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });
  if (error) {
    console.error("fetchSpheres:", error);
    return [];
  }
  return (data ?? []) as Sphere[];
}

/* ──────────────── Tasks ──────────────── */

export async function fetchTasks(): Promise<Task[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
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
  const user = await requireUser();
  const supabase = await createClient();
  const t = today();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
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
  const user = await requireUser();
  const supabase = await createClient();
  const t = today();
  const end = addDays(t, days);
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
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

/** Count of tasks completed since the server's local start-of-today.
    Cheap head-only count used by the Today progress bar. Note: dates in
    this app are local-day strings computed on whatever machine runs the
    code (see lib/date.ts); the server's midnight is the pragmatic
    boundary here, consistent with fetchTodayTasks using server today(). */
export async function fetchTodayCompletedCount(): Promise<number> {
  const user = await requireUser();
  const supabase = await createClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .gte("completed_at", start.toISOString());
  if (error) {
    console.error("fetchTodayCompletedCount:", error);
    return 0;
  }
  return count ?? 0;
}

/* ──────────────── Habits ──────────────── */

export async function fetchHabits(): Promise<Habit[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("archived", false)
    .order("position", { ascending: true });
  if (error) {
    console.error("fetchHabits:", error);
    return [];
  }
  return (data ?? []) as Habit[];
}

/** Completed tasks since `sinceIso` (a UTC ISO timestamp), most recent first.
    Used by the /stats page; the client narrows the window further by local
    timezone (today / week / month tabs). The window is sized large enough
    by the caller to also cover the previous-period delta (e.g. 62 days for
    a "month vs. previous month" comparison). */
export async function fetchCompletedTasks(
  sinceIso: string,
  limit = 500,
): Promise<Task[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .gte("completed_at", sinceIso)
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("fetchCompletedTasks:", error);
    return [];
  }
  return (data ?? []) as Task[];
}

/* ──────────────── Habit logs ──────────────── */

/** Logs for the last N days for all habits. RLS filters by habit ownership. */
export async function fetchRecentHabitLogs(days = 30): Promise<HabitLog[]> {
  await requireUser();
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
