import HabitsView from "../../habits/HabitsView";
import BottomNav from "@/components/BottomNav";
import Snackbar from "@/components/Snackbar";
import type { Habit, HabitLog } from "@/lib/data";

/* Dev-only visual preview of /habits with mock data (no Supabase).
   Not linked from anywhere — harmless in prod, mirrors /preview. */

export const dynamic = "force-dynamic";

const habits: Habit[] = [
  { id: "h1", user_id: "u1", name: "Медитация", emoji: "🧘", color: "#b5a3df", schedule_type: "daily", schedule_value: null, position: 0, archived: false, created_at: "2025-01-01" },
  { id: "h2", user_id: "u1", name: "Чтение", emoji: "📚", color: "#f5c563", schedule_type: "weekdays", schedule_value: { days: [1, 2, 3, 4, 5] }, position: 1, archived: false, created_at: "2025-01-01" },
  { id: "h3", user_id: "u1", name: "Вода 2л", emoji: "💧", color: "#6ba4c2", schedule_type: "daily", schedule_value: null, position: 2, archived: false, created_at: "2025-01-01" },
  { id: "h4", user_id: "u1", name: "Прогулка", emoji: "🚶", color: "#86c79a", schedule_type: "daily", schedule_value: null, position: 3, archived: false, created_at: "2025-01-01" },
];

function isoShift(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* h1: 6-day streak (feeds the hero card); h3: 3 days; h4: today only. */
const logs: HabitLog[] = [
  ...[0, 1, 2, 3, 4, 5].map((i) => ({
    habit_id: "h1",
    date: isoShift(-i),
    done_at: `${isoShift(-i)}T07:30:00Z`,
  })),
  ...[0, 1, 2].map((i) => ({
    habit_id: "h3",
    date: isoShift(-i),
    done_at: `${isoShift(-i)}T09:00:00Z`,
  })),
  { habit_id: "h4", date: isoShift(0), done_at: `${isoShift(0)}T18:00:00Z` },
];

export default function PreviewHabitsPage() {
  return (
    <>
      <HabitsView habits={habits} logs={logs} />
      <BottomNav />
      <Snackbar />
    </>
  );
}
