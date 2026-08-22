export type DefaultSphere = {
  name: string;
  color: string;
  emoji: string;
};

/* Seeded automatically for every new auth.users row by the DB trigger
   `on_auth_user_created`. The trigger reads `raw_user_meta_data->lang`
   set at signup and inserts names in that language; this constant is
   the Russian list (kept here for documentation parity). */
/* Warm-family seeds native to the «Рассвет» palette (caramel / clay /
   sage-olive) — new users get harmonious colors without any runtime
   correction; older cool seeds already in the DB are warmed at render
   time by src/lib/palette.ts. */
export const DEFAULT_SPHERES: DefaultSphere[] = [
  { name: "Работа", color: "#C98A4B", emoji: "💼" },
  { name: "Дом",    color: "#C4746B", emoji: "🏡" },
  { name: "Личное", color: "#9A9B6F", emoji: "🌿" },
];

export const DEFAULT_SPHERES_EN: DefaultSphere[] = [
  { name: "Work",     color: "#C98A4B", emoji: "💼" },
  { name: "Home",     color: "#C4746B", emoji: "🏡" },
  { name: "Personal", color: "#9A9B6F", emoji: "🌿" },
];
