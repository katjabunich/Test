"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AuthResult = { error: string | null };

function safeNext(next: string | null): string {
  if (!next) return "/";
  // Only allow same-origin paths to prevent open redirects.
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}

export async function signInWithPassword(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/"));

  if (!email || !password) {
    return { error: "Введи email и пароль." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: friendlyAuthError(error.message) };
  }
  redirect(next);
}

export async function signUpWithPassword(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const origin = String(formData.get("origin") ?? "").trim();

  if (!email || !password) {
    return { error: "Введи email и пароль." };
  }
  if (password.length < 8) {
    return { error: "Пароль должен быть от 8 символов." };
  }

  const supabase = await createClient();
  const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
  if (error) {
    return { error: friendlyAuthError(error.message) };
  }
  // If email confirmation is required, session will be null — show a hint
  // instead of redirecting into a still-unauthed app.
  if (!data.session) {
    return {
      error:
        "Подтверди email — мы отправили письмо со ссылкой. После подтверждения вернись и войди.",
    };
  }
  redirect("/");
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Неверный email или пароль.";
  if (m.includes("already registered") || m.includes("user already"))
    return "Такой аккаунт уже существует — войди.";
  if (m.includes("rate limit")) return "Слишком много попыток. Подожди минуту.";
  return message;
}
