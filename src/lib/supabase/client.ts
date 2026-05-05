import { createBrowserClient } from "@supabase/ssr";

/** Browser-side Supabase client. Reads anon key from public env vars
    (these are safe to expose; RLS policies enforce data access). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
