"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/* Error codes: client maps to translated strings via the i18n dict, so
   server actions stay locale-agnostic. */
export type AuthErrCode =
  | "required"
  | "pw_short"
  | "invalid"
  | "exists"
  | "rate"
  | "confirm_email";

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
  const origin = String(formData.get("origin") ?? "").trim();

  if (!email || !password) return { code: "required" };
  if (password.length < 8) return { code: "pw_short" };

  const supabase = await createClient();
  const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
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
  redirect("/");
}
