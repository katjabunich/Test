/* v1 has no auth — every request reads/writes for this single user.
   When auth is added in v2, replace usages with the authenticated user id. */
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export type DefaultSphere = {
  name: string;
  color: string;
  emoji: string;
};

/* Default spheres seeded on first load. User can edit/delete in /settings. */
export const DEFAULT_SPHERES: DefaultSphere[] = [
  { name: "Работа",      color: "#7DAEC4", emoji: "💼" },
  { name: "Дом",         color: "#F5B5A8", emoji: "🏡" },
  { name: "Канал",       color: "#F4C77A", emoji: "✨" },
  { name: "Голландский", color: "#E89B8E", emoji: "🇳🇱" },
  { name: "AI",          color: "#9CA8B0", emoji: "🤖" },
];
