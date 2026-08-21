import TodayView from "../TodayView";
import BottomNav from "@/components/BottomNav";
import Snackbar from "@/components/Snackbar";
import type { Habit, HabitLog, Sphere, Task } from "@/lib/data";

export const dynamic = "force-dynamic";

const spheres: Sphere[] = [
  { id: "s1", user_id: "u1", name: "Работа", color: "#6ba4c2", emoji: "💼", position: 0, created_at: "2025-01-01" },
  { id: "s2", user_id: "u1", name: "Здоровье", color: "#86c79a", emoji: "🏃", position: 1, created_at: "2025-01-01" },
  { id: "s3", user_id: "u1", name: "Дом", color: "#f4936e", emoji: "🏠", position: 2, created_at: "2025-01-01" },
];

const todayIso = new Date().toISOString().slice(0, 10);

const todayTasks: Task[] = [
  { id: "t0", user_id: "u1", title: "Отправить инвойс клиенту", sphere_id: "s1", due_date: "2025-05-22", do_today: false, note: null, recurrence: null, remind_at: null, reminded_at: null, recurrence_anchor: null, completed_at: null, created_at: "2025-05-15T08:00:00Z" },
  { id: "t0b", user_id: "u1", title: "Записаться к врачу", sphere_id: "s2", due_date: "2025-05-24", do_today: false, note: null, recurrence: null, remind_at: null, reminded_at: null, recurrence_anchor: null, completed_at: null, created_at: "2025-05-18T08:00:00Z" },
  { id: "t0c", user_id: "u1", title: "Подготовить презентацию", sphere_id: "s1", due_date: "2025-05-25", do_today: false, note: null, recurrence: null, remind_at: null, reminded_at: null, recurrence_anchor: null, completed_at: null, created_at: "2025-05-19T08:00:00Z" },
  { id: "t1", user_id: "u1", title: "Написать отчёт за квартал", sphere_id: "s1", due_date: todayIso, do_today: true, note: null, recurrence: null, remind_at: null, reminded_at: null, recurrence_anchor: null, completed_at: null, created_at: "2025-05-27T08:00:00Z" },
  { id: "t2", user_id: "u1", title: "Пробежка 5 км", sphere_id: "s2", due_date: todayIso, do_today: true, note: null, recurrence: null, remind_at: null, reminded_at: null, recurrence_anchor: null, completed_at: null, created_at: "2025-05-27T07:00:00Z" },
  { id: "t3", user_id: "u1", title: "Купить продукты", sphere_id: "s3", due_date: todayIso, do_today: false, note: "молоко, хлеб, яйца", recurrence: null, remind_at: null, reminded_at: null, recurrence_anchor: null, completed_at: null, created_at: "2025-05-27T09:00:00Z" },
];

const upcomingTasks: Task[] = [
  { id: "t4", user_id: "u1", title: "Встреча с дизайнером", sphere_id: "s1", due_date: "2025-05-29", do_today: false, note: null, recurrence: null, remind_at: null, reminded_at: null, recurrence_anchor: null, completed_at: null, created_at: "2025-05-20T09:00:00Z" },
];

const habits: Habit[] = [
  { id: "h1", user_id: "u1", name: "Медитация", emoji: "🧘", color: "#b5a3df", schedule_type: "daily", schedule_value: null, position: 0, archived: false, created_at: "2025-01-01" },
  { id: "h2", user_id: "u1", name: "Чтение", emoji: "📚", color: "#f5c563", schedule_type: "weekdays", schedule_value: null, position: 1, archived: false, created_at: "2025-01-01" },
  { id: "h3", user_id: "u1", name: "Вода 2л", emoji: "💧", color: "#6ba4c2", schedule_type: "daily", schedule_value: null, position: 2, archived: false, created_at: "2025-01-01" },
];

const logs: HabitLog[] = [
  { habit_id: "h1", date: todayIso, done_at: "2025-05-27T07:30:00Z" },
];

export default function PreviewPage() {
  return (
    <>
      <TodayView
        todayTasks={todayTasks}
        upcomingTasks={upcomingTasks}
        spheres={spheres}
        habits={habits}
        logs={logs}
        doneToday={2}
        initialName="Катя"
      />
      <BottomNav />
      <Snackbar />
    </>
  );
}
