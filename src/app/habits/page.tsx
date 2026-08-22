import { fetchHabits, fetchRecentHabitLogs } from "@/lib/db";
import HabitsView from "./HabitsView";

export const dynamic = "force-dynamic";

/* Status-bar zone in this screen's own sky colour (blush-peach) so the
   gradient reaches the very top of the screen. */
export const viewport = {
  themeColor: "#F5E1D6",
};

export default async function HabitsPage() {
  const [habits, logs] = await Promise.all([
    fetchHabits(),
    fetchRecentHabitLogs(30),
  ]);
  return <HabitsView habits={habits} logs={logs} />;
}
