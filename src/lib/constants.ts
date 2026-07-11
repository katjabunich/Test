export type DefaultSphere = {
  name: string;
  color: string;
  emoji: string;
};

/* Seeded automatically for every new auth.users row by the DB trigger
   `on_auth_user_created`. The trigger reads `raw_user_meta_data->lang`
   set at signup and inserts names in that language; this constant is
   the Russian list (kept here for documentation parity). */
export const DEFAULT_SPHERES: DefaultSphere[] = [
  { name: "Работа", color: "#f4936e", emoji: "💼" },
  { name: "Дом",    color: "#86c79a", emoji: "🏡" },
  { name: "Личное", color: "#b5a3df", emoji: "🌿" },
];

export const DEFAULT_SPHERES_EN: DefaultSphere[] = [
  { name: "Work",     color: "#f4936e", emoji: "💼" },
  { name: "Home",     color: "#86c79a", emoji: "🏡" },
  { name: "Personal", color: "#b5a3df", emoji: "🌿" },
];
