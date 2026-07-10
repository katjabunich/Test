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
  { name: "Работа", color: "#B9CFE2", emoji: "💼" },
  { name: "Дом",    color: "#F1DCA3", emoji: "🏡" },
  { name: "Личное", color: "#BFDCC6", emoji: "🌿" },
];

export const DEFAULT_SPHERES_EN: DefaultSphere[] = [
  { name: "Work",     color: "#B9CFE2", emoji: "💼" },
  { name: "Home",     color: "#F1DCA3", emoji: "🏡" },
  { name: "Personal", color: "#BFDCC6", emoji: "🌿" },
];
