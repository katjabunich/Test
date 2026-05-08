"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkInviteCode } from "@/lib/env";
import { DEFAULT_SPHERES, DEFAULT_SPHERES_EN } from "@/lib/constants";

/* Replace whatever the on_auth_user_created DB trigger seeded with the
   minimal generic set in the user's language. The trigger is left
   untouched (its other job — auto-confirming email — still runs); we
   just overwrite its sphere output here, no SQL migration required. */
async function reseedSpheres(userId: string, lang: "ru" | "en") {
  const supabase = await createClient();
  const { error: delErr } = await supabase
    .from("spheres")
    .delete()
    .eq("user_id", userId);
  if (delErr) {
    console.error("reseedSpheres delete:", delErr);
    return;
  }
  const defaults = lang === "en" ? DEFAULT_SPHERES_EN : DEFAULT_SPHERES;
  const rows = defaults.map((s, i) => ({
    user_id: userId,
    name: s.name,
    color: s.color,
    emoji: s.emoji,
    position: i,
  }));
  const { error: insErr } = await supabase.from("spheres").insert(rows);
  if (insErr) console.error("reseedSpheres insert:", insErr);
}

/* Error codes: client maps to translated strings via the i18n dict, so
   server actions stay locale-agnostic. */
export type AuthErrCode =
  | "required"
  | "pw_short"
  | "invalid"
  | "exists"
  | "rate"
  | "confirm_email"
  | "bad_invite"
  | "invite_no_env";

export type AuthResult = { code: AuthErrCode | null; raw?: string };

function safeNext(next: string | null): string {
  if (!next) return "/";
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

function classify(message: string): AuthErrCode | null {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "invalid";
  if (m.includes("already registered") || m.includes("user already")) return "exists";
  if (m.includes("rate limit")) return "rate";
  return null;
}

export async function signInWithPassword(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/"));

  if (!email || !password) return { code: "required" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { code: classify(error.message) ?? "invalid", raw: error.message };
  redirect(next);
}

export async function signUpWithPassword(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const invite = String(formData.get("invite") ?? "");
  const origin = String(formData.get("origin") ?? "").trim();
  const langRaw = String(formData.get("lang") ?? "");
  const lang = langRaw === "en" ? "en" : "ru";

  if (!email || !password) return { code: "required" };
  if (password.length < 8) return { code: "pw_short" };
  const inviteStatus = checkInviteCode(invite);
  if (inviteStatus === "no_env") return { code: "invite_no_env" };
  if (inviteStatus === "mismatch") return { code: "bad_invite" };

  const supabase = await createClient();
  const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined;
  /* Pass `lang` via user metadata so the on-signup DB trigger seeds
     default spheres in the user's language. */
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { lang },
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });
  if (error) return { code: classify(error.message), raw: error.message };

  // A DB trigger auto-confirms email_confirmed_at so the user is usable
  // immediately even though Supabase Auth, configured for confirmation,
  // returned a null session. Try the sign-in path so we land on a
  // proper session in the same round trip.
  if (!data.session) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      // Fall back to the original "check your inbox" flow if auto-sign-in
      // failed for any reason (e.g. project actually requires confirmation
      // in some unforeseen path).
      return { code: "confirm_email" };
    }
  }
  if (data.user?.id) await reseedSpheres(data.user.id, lang);
  redirect("/");
}
