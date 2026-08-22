import StatsView from "../../stats/StatsView";
import BottomNav from "@/components/BottomNav";
import Snackbar from "@/components/Snackbar";
import type { Sphere, Task } from "@/lib/data";

/* Dev-only visual preview of /stats with mock data (no Supabase).
   Not linked from anywhere — harmless in prod, mirrors /preview. */

export const dynamic = "force-dynamic";

const spheres: Sphere[] = [
  { id: "s1", user_id: "u1", name: "Работа", color: "#6ba4c2", emoji: "💼", position: 0, created_at: "2025-01-01" },
  { id: "s2", user_id: "u1", name: "Здоровье", color: "#86c79a", emoji: "🏃", position: 1, created_at: "2025-01-01" },
  { id: "s3", user_id: "u1", name: "Дом", color: "#f4936e", emoji: "🏠", position: 2, created_at: "2025-01-01" },
];

function completedAt(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const base = {
  user_id: "u1",
  due_date: null,
  do_today: false,
  note: null,
  recurrence: null,
  recurrence_anchor: null,
  remind_at: null,
  reminded_at: null,
  created_at: "2025-05-01T08:00:00Z",
};

/* A couple of weeks of finished tasks: 3 today, then a scattering over
   the previous ~16 days so week/month tabs and the calendars have data. */
const titles: [string, string | null][] = [
  ["Созвон с командой", "s1"],
  ["Йога 30 минут", "s2"],
  ["Полить цветы", "s3"],
  ["Ответить на письма", "s1"],
  ["Пробежка 5 км", "s2"],
  ["Список покупок", "s3"],
  ["Ревью макетов", "s1"],
  ["Витамины", "s2"],
  ["Разобрать почту", null],
];

const plan: [number, number][] = [
  // [daysAgo, hour]
  [0, 9], [0, 12], [0, 17],
  [1, 10], [1, 15],
  [2, 11],
  [3, 9], [3, 13], [3, 19],
  [5, 12],
  [6, 10], [6, 16],
  [8, 9],
  [10, 14], [10, 18],
  [12, 11],
  [14, 10],
  [16, 15],
];

const completed: Task[] = plan.map(([daysAgo, hour], i) => {
  const [title, sphereId] = titles[i % titles.length];
  return {
    ...base,
    id: `c${i}`,
    title,
    sphere_id: sphereId,
    completed_at: completedAt(daysAgo, hour, (i * 7) % 60),
  };
});

export default function PreviewStatsPage() {
  return (
    <>
      <StatsView completed={completed} spheres={spheres} />
      <BottomNav />
      <Snackbar />
    </>
  );
}
