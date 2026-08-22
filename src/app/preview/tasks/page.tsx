import TasksView from "../../tasks/TasksView";
import BottomNav from "@/components/BottomNav";
import Snackbar from "@/components/Snackbar";
import type { Sphere, Task } from "@/lib/data";

/* Dev-only visual preview of /tasks with mock data (no Supabase).
   Not linked from anywhere — harmless in prod, mirrors /preview. */

export const dynamic = "force-dynamic";

const spheres: Sphere[] = [
  { id: "s1", user_id: "u1", name: "Работа", color: "#6ba4c2", emoji: "💼", position: 0, created_at: "2025-01-01" },
  { id: "s2", user_id: "u1", name: "Здоровье", color: "#86c79a", emoji: "🏃", position: 1, created_at: "2025-01-01" },
  { id: "s3", user_id: "u1", name: "Дом", color: "#f4936e", emoji: "🏠", position: 2, created_at: "2025-01-01" },
];

function isoShift(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const base = {
  user_id: "u1",
  do_today: false,
  note: null,
  recurrence: null,
  recurrence_anchor: null,
  remind_at: null,
  reminded_at: null,
  completed_at: null,
  created_at: "2025-05-01T08:00:00Z",
};

const tasks: Task[] = [
  // today
  { ...base, id: "t1", title: "Написать отчёт за квартал", sphere_id: "s1", due_date: isoShift(0), do_today: true },
  { ...base, id: "t2", title: "Пробежка 5 км", sphere_id: "s2", due_date: isoShift(0) },
  // this week
  { ...base, id: "t3", title: "Встреча с дизайнером", sphere_id: "s1", due_date: isoShift(2) },
  { ...base, id: "t4", title: "Купить продукты", sphere_id: "s3", due_date: isoShift(4), note: "молоко, хлеб, яйца" },
  // later
  { ...base, id: "t5", title: "Продлить страховку", sphere_id: "s3", due_date: isoShift(12) },
  // no date
  { ...base, id: "t6", title: "Разобрать фотоархив", sphere_id: null, due_date: null },
  // overdue ×2
  { ...base, id: "t7", title: "Отправить инвойс клиенту", sphere_id: "s1", due_date: isoShift(-3) },
  { ...base, id: "t8", title: "Записаться к врачу", sphere_id: "s2", due_date: isoShift(-1) },
];

export default function PreviewTasksPage() {
  return (
    <>
      <TasksView tasks={tasks} spheres={spheres} />
      <BottomNav />
      <Snackbar />
    </>
  );
}
