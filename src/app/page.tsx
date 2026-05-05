import {
  fetchHabits,
  fetchRecentHabitLogs,
  fetchSpheres,
  fetchTodayTasks,
  fetchUpcomingTasks,
} from "@/lib/db";
import TodayView from "./TodayView";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [todayTasks, upcomingTasks, spheres, habits, logs] = await Promise.all([
    fetchTodayTasks(),
    fetchUpcomingTasks(7),
    fetchSpheres(),
    fetchHabits(),
    fetchRecentHabitLogs(7),
  ]);

  return (
    <TodayView
      todayTasks={todayTasks}
      upcomingTasks={upcomingTasks}
      spheres={spheres}
      habits={habits}
      logs={logs}
    />
  );
}
