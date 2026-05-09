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

/* ──────────────── User prefs (daily digest) ──────────────── */

export type UserPrefs = {
  digest_at_local: string | null; // "HH:MM" in the user's TZ, derived
  digest_at_utc: string | null;   // "HH:MM" raw from DB
};

export async function fetchUserPrefs(): Promise<UserPrefs> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("doit_user_prefs")
    .select("digest_at_utc")
    .eq("user_id", user.id)
    .maybeSingle();
  const utc = data?.digest_at_utc ?? null;
  return {
    digest_at_utc: utc ? utc.slice(0, 5) : null,
    // The TZ-aware rendering happens client-side; here we just hand the
    // UTC value back.
    digest_at_local: null,
  };
}

/** Save the digest time. Pass an HH:MM string in the user's LOCAL time
   plus their tz offset in minutes (Date.prototype.getTimezoneOffset()).
   We convert to UTC at write time so the cron can compare against
   `now() at time zone 'UTC'` cheaply. */
export async function setDigestTime(localHHMM: string | null, tzOffsetMinutes: number) {
  const user = await requireUser();
  const supabase = await createClient();

  let utcTime: string | null = null;
  if (localHHMM) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(localHHMM);
    if (!m) throw new Error("invalid_time");
    const localH = Number(m[1]);
    const localMin = Number(m[2]);
    if (localH < 0 || localH > 23 || localMin < 0 || localMin > 59) {
      throw new Error("invalid_time");
    }
    // getTimezoneOffset returns minutes local-LAGS-UTC. Moscow (UTC+3)
    // → -180. Add the offset to local time to get UTC.
    const totalMinLocal = localH * 60 + localMin;
    const totalMinUtc = ((totalMinLocal + tzOffsetMinutes) % 1440 + 1440) % 1440;
    const h = Math.floor(totalMinUtc / 60);
    const mm = totalMinUtc % 60;
    utcTime = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
  }

  // Reset the last-sent stamp so a fresh schedule starts clean (no
  // accidental "already sent today" suppression after a re-enable).
  const { error } = await supabase
    .from("doit_user_prefs")
    .upsert(
      {
        user_id: user.id,
        digest_at_utc: utcTime,
        digest_last_sent_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
