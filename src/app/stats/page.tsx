import { fetchSpheres, fetchCompletedTasks } from "@/lib/db";
import StatsView from "./StatsView";

export const dynamic = "force-dynamic";

/* Server window covers slightly more than a calendar month so the client
   can safely partition into today / week / month tabs in local TZ without
   missing rows that completed near the boundary. */
const WINDOW_DAYS = 35;

export default async function StatsPage() {
  const sinceIso = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const [completed, spheres] = await Promise.all([
    fetchCompletedTasks(sinceIso),
    fetchSpheres(),
  ]);
  return <StatsView completed={completed} spheres={spheres} />;
}
