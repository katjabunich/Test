import {
  fetchHabits,
  fetchRecentHabitLogs,
  fetchSpheres,
  fetchTodayCompletedCount,
  fetchTodayTasks,
  fetchUpcomingTasks,
} from "@/lib/db";
import { requireUser } from "@/lib/auth";
import TodayView from "./TodayView";

export const dynamic = "force-dynamic";

/* Today only: paint the iOS status-bar zone (which standalone PWA fills
   with themeColor) in the sky color so the dawn scene reaches the very
   top of the screen; other routes keep the cream default from layout. */
export const viewport = {
  themeColor: "#F6DFC2",
};

export default async function TodayPage() {
  const user = await requireUser();
  const [todayTasks, upcomingTasks, spheres, habits, logs, doneToday] =
    await Promise.all([
      fetchTodayTasks(),
      fetchUpcomingTasks(7),
      fetchSpheres(),
      fetchHabits(),
      fetchRecentHabitLogs(7),
      fetchTodayCompletedCount(),
    ]);

  const meta = (user.user_metadata ?? {}) as { display_name?: string | null };
  const initialName =
    typeof meta.display_name === "string" && meta.display_name.trim()
      ? meta.display_name.trim()
      : null;

  return (
    <TodayView
      todayTasks={todayTasks}
      upcomingTasks={upcomingTasks}
      spheres={spheres}
      habits={habits}
      logs={logs}
      doneToday={doneToday}
      initialName={initialName}
    />
  );
}
