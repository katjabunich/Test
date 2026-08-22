import { fetchSpheres, fetchTasks } from "@/lib/db";
import TasksView from "./TasksView";

export const dynamic = "force-dynamic";

/* Paint the iOS status-bar zone in the screen's own sky colour so the
   sand gradient reaches the very top of the screen (same pattern as
   Today's #F6DFC2). */
export const viewport = {
  themeColor: "#F4E6D2",
};

export default async function TasksPage() {
  const [tasks, spheres] = await Promise.all([fetchTasks(), fetchSpheres()]);
  return <TasksView tasks={tasks} spheres={spheres} />;
}
