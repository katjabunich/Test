/* v1 has no auth — every request reads/writes for this single user.
   When auth is added in v2, replace usages with the authenticated user id. */
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export type DefaultSphere = {
  name: string;
  color: string;
  emoji: string;
};

/* Default spheres (v4 palette). User can edit/delete in /settings. */
export const DEFAULT_SPHERES: DefaultSphere[] = [
  { name: "Работа",      color: "#f4936e", emoji: "💼" },
  { name: "Канал",       color: "#f5c563", emoji: "✨" },
  { name: "Дом",         color: "#86c79a", emoji: "🏡" },
  { name: "Голландский", color: "#6ba4c2", emoji: "🇳🇱" },
  { name: "AI",          color: "#b5a3df", emoji: "🤖" },
];
