import { fetchSpheres, fetchTasks } from "@/lib/db";
import TasksView from "./TasksView";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, spheres] = await Promise.all([fetchTasks(), fetchSpheres()]);
  return <TasksView tasks={tasks} spheres={spheres} />;
}
