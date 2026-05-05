import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkSupabaseEnv, getSupabaseAnonKey, getSupabaseUrl, MissingEnvError } from "@/lib/env";

/** Server-side Supabase client for App Router. */
export async function createClient() {
  const env = checkSupabaseEnv();
  if (!env.ok) throw new MissingEnvError(env.missing);

  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl()!,
    getSupabaseAnonKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context — set may throw; safe to ignore.
          }
        },
      },
    },
  );
}
