import { fetchSpheres, fetchCompletedTasks } from "@/lib/db";
import StatsView from "./StatsView";

export const dynamic = "force-dynamic";

/* Status-bar zone in this screen's own sky colour (caramel-amber) so the
   gradient reaches the very top of the screen. */
export const viewport = {
  themeColor: "#F5E7CC",
};

/* Server window covers two months — a 30-day "month" tab plus the previous
   30 days needed for the comparison delta in the hero, with a few days of
   slack for local-timezone boundaries. */
const WINDOW_DAYS = 62;

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
