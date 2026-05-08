import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MissingEnvError } from "@/lib/env";

/** Returns the current Supabase auth user, or null if no session. Tolerates
    a missing-env build context (e.g. `_not-found` static prerender) by
    returning null instead of crashing the build. */
export async function getUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch (e) {
    if (e instanceof MissingEnvError) return null;
    throw e;
  }
}

/** Same as getUser but redirects to /login when no session. Use in
    server pages and server actions that require authentication. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
