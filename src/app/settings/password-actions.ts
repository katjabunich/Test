"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type PwErrCode = "pw_short" | "pw_match" | "pw_same";

export type PwResult = { code: PwErrCode | null; raw?: string };

export async function updatePassword(formData: FormData): Promise<PwResult> {
  await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { code: "pw_short" };
  if (password !== confirm) return { code: "pw_match" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("same") || m.includes("different")) return { code: "pw_same" };
    return { code: null, raw: error.message };
  }
  return { code: null };
}
