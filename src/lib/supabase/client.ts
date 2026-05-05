import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/** Browser-side Supabase client. Sanitizes env values to tolerate accidental
    quotes or angle-brackets that creep in from copy-paste. */
export function createClient() {
  return createBrowserClient(getSupabaseUrl()!, getSupabaseAnonKey()!);
}
