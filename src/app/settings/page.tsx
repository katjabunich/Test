import { fetchSpheres } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fetchUserPrefs } from "@/lib/profile";
import SettingsView from "./SettingsView";

export const dynamic = "force-dynamic";

/* Status-bar zone in this screen's own (quietest) sky colour so the
   gradient reaches the very top of the screen. */
export const viewport = {
  themeColor: "#F3EADF",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const [spheres, prefs] = await Promise.all([fetchSpheres(), fetchUserPrefs()]);
  return (
    <SettingsView
      spheres={spheres}
      userEmail={user.email ?? null}
      digestAtUtc={prefs.digest_at_utc}
    />
  );
}
