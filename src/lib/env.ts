/* Validate required env vars at startup. Returns clear error messages
   instead of letting Supabase throw a confusing "Invalid URL" error. */

export type EnvCheck = {
  ok: boolean;
  missing: string[];
  url: string | undefined;
  hasKey: boolean;
};

/** Strip wrapping characters that sneak in when copy-pasting from markdown
   links (`<https://…>`) or quoted hints (`"…"`), plus stray whitespace. */
function sanitize(value: string | undefined): string | undefined {
  if (!value) return value;
  let v = value.trim();
  if (v.startsWith("<") && v.endsWith(">")) v = v.slice(1, -1);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

export function getSupabaseUrl(): string | undefined {
  return sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string | undefined {
  return sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function checkSupabaseEnv(): EnvCheck {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return {
    ok: missing.length === 0,
    missing,
    url,
    hasKey: !!key,
  };
}

/* Server-only. Codes live in the `INVITE_CODES` env var as a
   comma-separated list. Comparison is case-insensitive and ignores
   surrounding whitespace so users can paste without worrying about
   trailing spaces. Fails closed: an empty/unset env means no signup. */
export function isValidInviteCode(input: string): boolean {
  return checkInviteCode(input) === "ok";
}

export type InviteCheck = "ok" | "no_env" | "mismatch";

export function checkInviteCode(input: string): InviteCheck {
  const raw = process.env.INVITE_CODES ?? "";
  const codes = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (codes.length === 0) return "no_env";
  return codes.includes(input.trim().toLowerCase()) ? "ok" : "mismatch";
}

export class MissingEnvError extends Error {
  constructor(missing: string[]) {
    super(`Missing env vars: ${missing.join(", ")}`);
    this.name = "MissingEnvError";
  }
}
