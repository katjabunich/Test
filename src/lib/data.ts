/* Domain types — mirror the Supabase schema. */

export type Sphere = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  emoji: string | null;
  position: number;
  created_at: string;
};

export type Recurrence = "daily" | "weekly" | "biweekly" | "monthly" | null;

export type Task = {
  id: string;
  user_id: string;
  title: string;
  sphere_id: string | null;
  due_date: string | null;        // ISO date (YYYY-MM-DD)
  do_today: boolean;
  note: string | null;
  recurrence: Recurrence;
  recurrence_anchor: string | null;
  remind_at: string | null;       // ISO timestamp — when to fire push
  reminded_at: string | null;     // ISO timestamp — when push was sent
  completed_at: string | null;    // ISO timestamp
  created_at: string;
};

export type HabitScheduleType = "daily" | "weekdays" | "n_per_week";

export type HabitScheduleValue =
  | { days: number[] }   // 0=Sun..6=Sat
  | { n: number }
  | null;

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  schedule_type: HabitScheduleType;
  schedule_value: HabitScheduleValue;
  position: number;
  archived: boolean;
  created_at: string;
};

export type HabitLog = {
  habit_id: string;
  date: string;     // YYYY-MM-DD
  done_at: string;  // ISO timestamp
};
