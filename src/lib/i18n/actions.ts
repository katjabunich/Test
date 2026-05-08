"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Lang } from "./dict";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

const COOKIE_NAME = "dela.lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Set the language cookie + (if signed in) sync to user_metadata so the
    choice follows the user across devices. */
export async function setLanguageAction(lang: Lang) {
  const c = await cookies();
  c.set(COOKIE_NAME, lang, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  const user = await getUser();
  if (user) {
    const supabase = await createClient();
    await supabase.auth.updateUser({ data: { language: lang } });
  }

  revalidatePath("/", "layout");
}
