export type DefaultSphere = {
  name: string;
  color: string;
  emoji: string;
};

/* Seeded automatically for every new auth.users row (DB trigger
   `on_auth_user_created`). Edited / deleted from /settings. */
export const DEFAULT_SPHERES: DefaultSphere[] = [
  { name: "Работа",      color: "#f4936e", emoji: "💼" },
  { name: "Канал",       color: "#f5c563", emoji: "✨" },
  { name: "Дом",         color: "#86c79a", emoji: "🏡" },
  { name: "Голландский", color: "#6ba4c2", emoji: "🇳🇱" },
  { name: "AI",          color: "#b5a3df", emoji: "🤖" },
];
