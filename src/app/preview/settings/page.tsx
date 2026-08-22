import SettingsView from "../../settings/SettingsView";
import BottomNav from "@/components/BottomNav";
import Snackbar from "@/components/Snackbar";
import type { Sphere } from "@/lib/data";

/* Dev-only visual preview of /settings with mock data (no Supabase).
   Not linked from anywhere — harmless in prod, mirrors /preview. */

export const dynamic = "force-dynamic";

const spheres: Sphere[] = [
  { id: "s1", user_id: "u1", name: "Работа", color: "#6ba4c2", emoji: "💼", position: 0, created_at: "2025-01-01" },
  { id: "s2", user_id: "u1", name: "Здоровье", color: "#86c79a", emoji: "🏃", position: 1, created_at: "2025-01-01" },
  { id: "s3", user_id: "u1", name: "Дом", color: "#f4936e", emoji: "🏠", position: 2, created_at: "2025-01-01" },
];

export default function PreviewSettingsPage() {
  return (
    <>
      <SettingsView
        spheres={spheres}
        userEmail="katja.bunich@gmail.com"
        digestAtUtc="06:30:00"
      />
      <BottomNav />
      <Snackbar />
    </>
  );
}
