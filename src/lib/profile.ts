"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

/** Persist the display name into Supabase Auth user_metadata so it
    follows the user across devices. Empty / whitespace-only clears it. */
export async function updateDisplayName(raw: string) {
  await requireUser();
  const trimmed = raw.trim().slice(0, 30);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed || null },
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}
