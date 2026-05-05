import { fetchSpheres } from "@/lib/db";
import SettingsView from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const spheres = await fetchSpheres();
  return <SettingsView spheres={spheres} />;
}
