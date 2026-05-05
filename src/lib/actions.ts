"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEV_USER_ID } from "@/lib/constants";
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
};

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    user_id: DEV_USER_ID,
    title: input.title,
    sphere_id: input.sphere_id ?? null,
    due_date: input.due_date ?? null,
    do_today: input.do_today ?? false,
    note: input.note ?? null,
    recurrence: input.recurrence ?? null,
    recurrence_anchor: input.recurrence ? (input.due_date ?? today()) : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function updateTask(id: string, patch: Partial<CreateTaskInput>) {
  const supabase = await createClient();
  const update: Record<string, unknown> = { ...patch };
  // Re-anchor recurrence if recurrence changed.
  if ("recurrence" in patch) {
    update.recurrence_anchor = patch.recurrence
      ? (patch.due_date ?? today())
      : null;
  }
  const { error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

/** Mark a task complete. If recurring, also create the next occurrence. */
export async function completeTask(id: string) {
  const supabase = await createClient();

  const { data: task, error: readErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", DEV_USER_ID)
    .single();
  if (readErr) throw new Error(readErr.message);
  if (!task) return;

  const { error: updErr } = await supabase
    .from("tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);
  if (updErr) throw new Error(updErr.message);

  if (task.recurrence) {
    const anchor = task.due_date ?? task.recurrence_anchor ?? today();
    const next = nextOccurrence(anchor, task.recurrence);
    if (next) {
      await supabase.from("tasks").insert({
        user_id: DEV_USER_ID,
        title: task.title,
        sphere_id: task.sphere_id,
        due_date: next,
        do_today: false,
        note: task.note,
        recurrence: task.recurrence,
        recurrence_anchor: next,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function uncompleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: null })
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/tasks");
}

/* ──────────────── Spheres ──────────────── */

export async function createSphere(input: { name: string; color: string; emoji?: string | null }) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("spheres")
    .select("position")
    .eq("user_id", DEV_USER_ID)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase.from("spheres").insert({
    user_id: DEV_USER_ID,
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("spheres")
    .update(patch)
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function deleteSphere(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("spheres")
    .delete()
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);
  if (error) throw new Error(error.message);
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
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("habits")
    .select("position")
    .eq("user_id", DEV_USER_ID)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { error } = await supabase.from("habits").insert({
    user_id: DEV_USER_ID,
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("habits")
    .update(patch)
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function deleteHabit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", id)
    .eq("user_id", DEV_USER_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function toggleHabitLog(habitId: string, date: string) {
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
