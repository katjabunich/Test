import { fetchHabits, fetchRecentHabitLogs } from "@/lib/db";
import HabitsView from "./HabitsView";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const [habits, logs] = await Promise.all([
    fetchHabits(),
    fetchRecentHabitLogs(30),
  ]);
  return <HabitsView habits={habits} logs={logs} />;
}
