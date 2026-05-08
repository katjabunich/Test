"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

type Result = { error: string | null };

export async function updatePassword(formData: FormData): Promise<Result> {
  await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Пароль должен быть от 8 символов." };
  if (password !== confirm) return { error: "Пароли не совпадают." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("same") || m.includes("different")) {
      return { error: "Новый пароль должен отличаться от старого." };
    }
    return { error: error.message };
  }
  return { error: null };
}
