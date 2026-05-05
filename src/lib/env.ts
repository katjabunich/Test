/* Validate required env vars at startup. Returns clear error messages
   instead of letting Supabase throw a confusing "Invalid URL" error. */

export type EnvCheck = {
  ok: boolean;
  missing: string[];
  url: string | undefined;
  hasKey: boolean;
};

export function checkSupabaseEnv(): EnvCheck {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

export class MissingEnvError extends Error {
  constructor(missing: string[]) {
    super(`Missing env vars: ${missing.join(", ")}`);
    this.name = "MissingEnvError";
  }
}
