"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkInviteCode } from "@/lib/env";

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

/** Match common Supabase Auth error strings to our locale-agnostic codes.
    "Email not confirmed" needs its own bucket — surfacing it as "invalid"
    lies to the user (they think the password is wrong when actually they
    just need to confirm). */
function classify(message: string): AuthErrCode | null {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed") || m.includes("email_not_confirmed"))
    return "confirm_email";
  if (m.includes("invalid login") || m.includes("invalid_credentials"))
    return "invalid";
  if (m.includes("already registered") || m.includes("user already") || m.includes("user_already_exists"))
    return "exists";
  if (m.includes("rate limit") || m.includes("over_request_rate") || m.includes("too many"))
    return "rate";
  if (m.includes("password should be") || m.includes("weak_password"))
    return "pw_short";
  return null;
}

/** Email normalisation. Trim and lowercase so case- or whitespace-only
    differences between signup and signin don't surface as "wrong password"
    on a freshly-created account. Supabase already lowercases on read, but
    doing it client-side keeps the round-trip predictable. */
function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function signInWithPassword(formData: FormData): Promise<AuthResult> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/"));

  if (!email || !password) return { code: "required" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { code: classify(error.message) ?? "invalid", raw: error.message };
  redirect(next);
}

export async function signUpWithPassword(formData: FormData): Promise<AuthResult> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
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
      // Surface the real reason instead of always telling the user to
      // check their inbox — sometimes the trigger ran and the issue is
      // elsewhere (e.g. weak password rejected post-hoc, rate limit).
      const code = classify(signInErr.message) ?? "confirm_email";
      return { code, raw: signInErr.message };
    }
  }
  redirect("/");
}
