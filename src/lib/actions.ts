"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { nextOccurrence } from "@/lib/recurrence";
import { today } from "@/lib/date";
import type { Recurrence, HabitScheduleType, HabitScheduleValue } from "@/lib/data";

/* ──────────────── Tasks ──────────────── */

export type CreateTaskInput = {
  title: string;
  sphere_id?: string | null;
  due_date?: string | null;
  do_today?: boolean;
  note?: string | null;
  recurrence?: Recurrence;
  remind_at?: string | null;       // ISO timestamp; null = no reminder
};

export async function createTask(input: CreateTaskInput) {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: input.title,
    sphere_id: input.sphere_id ?? null,
    due_date: input.due_date ?? null,
    do_today: input.do_today ?? false,
    note: input.note ?? null,
    recurrence: input.recurrence ?? null,
    recurrence_anchor: input.recurrence ? (input.due_date ?? today()) : null,
    remind_at: input.remind_at ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function updateTask(id: string, patch: Partial<CreateTaskInput>) {
  await requireUser();
  const supabase = await createClient();
  const update: Record<string, unknown> = { ...patch };
  // Re-anchor recurrence if recurrence changed.
  if ("recurrence" in patch) {
    update.recurrence_anchor = patch.recurrence
      ? (patch.due_date ?? today())
      : null;
  }
  // Editing the reminder clears any prior "already sent" mark so the new
  // time fires fresh.
  if ("remind_at" in patch) {
    update.reminded_at = null;
  }
  const { error } = await supabase.from("tasks").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

/** Mark a task complete. If recurring, also create the next occurrence. */
export async function completeTask(id: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: task, error: readErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();
  if (readErr) throw new Error(readErr.message);
  if (!task) return;

  const { error: updErr } = await supabase
    .from("tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id);
  if (updErr) throw new Error(updErr.message);

  if (task.recurrence) {
    const anchor = task.due_date ?? task.recurrence_anchor ?? today();
    const next = nextOccurrence(anchor, task.recurrence);
    if (next) {
      // Carry the reminder forward: shift it by the same delta as the
      // due date so the user keeps the same time of day on the new
      // instance. Skips silently when the previous instance had no
      // due_date to anchor against.
      let nextRemindAt: string | null = null;
      if (task.remind_at && task.due_date) {
        const oldDueMs = new Date(`${task.due_date}T00:00:00Z`).getTime();
        const newDueMs = new Date(`${next}T00:00:00Z`).getTime();
        const deltaMs = newDueMs - oldDueMs;
        if (Number.isFinite(deltaMs)) {
          nextRemindAt = new Date(new Date(task.remind_at).getTime() + deltaMs).toISOString();
        }
      }
      await supabase.from("tasks").insert({
        user_id: user.id,
        title: task.title,
        sphere_id: task.sphere_id,
        due_date: next,
        do_today: false,
        note: task.note,
        recurrence: task.recurrence,
        recurrence_anchor: next,
        remind_at: nextRemindAt,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function uncompleteTask(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

/** Push a task's due date by N days. Anchored to the task's CURRENT
    due_date so a future task moves to "current+N", an undated task lands
    on today+N, and an overdue task quietly recedes by N days too — the
    semantics ride alongside whatever day the user already had in mind.
    Also clears do_today so it leaves the Today screen, and resets the
    reminder mark so the new date fires fresh. */
export async function deferTask(id: string, days = 1) {
  await requireUser();
  const supabase = await createClient();

  const { data: task, error: readErr } = await supabase
    .from("tasks")
    .select("due_date")
    .eq("id", id)
    .single();
  if (readErr) throw new Error(readErr.message);

  const base = task?.due_date
    ? new Date(`${task.due_date}T00:00:00`)
    : (() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
      })();
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  const iso = `${y}-${m}-${d}`;

  const { error } = await supabase
    .from("tasks")
    .update({ due_date: iso, do_today: false, reminded_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

/* ──────────────── Spheres ──────────────── */

export async function createSphere(input: { name: string; color: string; emoji?: string | null }) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("spheres")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase.from("spheres").insert({
    user_id: user.id,
    name: input.name,
    color: input.color,
    emoji: input.emoji ?? null,
    position: nextPos,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function updateSphere(id: string, patch: { name?: string; color?: string; emoji?: string | null }) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("spheres").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function deleteSphere(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("spheres").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/tasks");
  revalidatePath("/");
}

/** Persist a new sphere ordering by writing each id's array index to its
    `position` column. Bound by the user_id filter so RLS plus the explicit
    check both refuse cross-tenant writes. */
export async function reorderSpheres(orderedIds: string[]) {
  const user = await requireUser();
  const supabase = await createClient();
  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase
        .from("spheres")
        .update({ position: i })
        .eq("id", id)
        .eq("user_id", user.id),
    ),
  );
  for (const r of results) if (r.error) throw new Error(r.error.message);
  revalidatePath("/settings");
  revalidatePath("/tasks");
  revalidatePath("/");
}

/* ──────────────── Habits ──────────────── */

export type CreateHabitInput = {
  name: string;
  emoji?: string | null;
  color?: string | null;
  schedule_type: HabitScheduleType;
  schedule_value?: HabitScheduleValue;
};

export async function createHabit(input: CreateHabitInput) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("habits")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: input.name,
    emoji: input.emoji ?? null,
    color: input.color ?? null,
    schedule_type: input.schedule_type,
    schedule_value: input.schedule_value ?? null,
    position: nextPos,
    archived: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function updateHabit(id: string, patch: Partial<CreateHabitInput> & { archived?: boolean }) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("habits").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function deleteHabit(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/habits");
  revalidatePath("/");
}

/** Persist a new habit ordering — same shape as reorderSpheres. */
export async function reorderHabits(orderedIds: string[]) {
  const user = await requireUser();
  const supabase = await createClient();
  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase
        .from("habits")
        .update({ position: i })
        .eq("id", id)
        .eq("user_id", user.id),
    ),
  );
  for (const r of results) if (r.error) throw new Error(r.error.message);
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function toggleHabitLog(habitId: string, date: string) {
  await requireUser();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("habit_id")
    .eq("habit_id", habitId)
    .eq("date", date)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("date", date);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("habit_logs")
      .insert({ habit_id: habitId, date });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/habits");
  revalidatePath("/");
}
