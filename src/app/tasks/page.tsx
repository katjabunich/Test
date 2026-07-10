import { fetchCompletedTasks, fetchSpheres, fetchTasks } from "@/lib/db";
import TasksView from "./TasksView";

export const dynamic = "force-dynamic";

/* Completed-archive window: last 90 days is plenty for a personal list
   and keeps the payload bounded. */
const ARCHIVE_DAYS = 90;

export default async function TasksPage() {
  const since = new Date(
    Date.now() - ARCHIVE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const [tasks, spheres, completed] = await Promise.all([
    fetchTasks(),
    fetchSpheres(),
    fetchCompletedTasks(since, 300),
  ]);
  return <TasksView tasks={tasks} spheres={spheres} completed={completed} />;
}
