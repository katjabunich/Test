import { fetchSpheres } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import SettingsView from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const spheres = await fetchSpheres();
  return <SettingsView spheres={spheres} userEmail={user.email ?? null} />;
}
