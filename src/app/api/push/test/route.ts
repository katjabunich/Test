import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@doit-tracker.app";
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "vapid_missing" }, { status: 500 });
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const { data: subs, error } = await supabase
    .from("doit_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user.id);
  if (error) {
    console.error("push test fetch:", error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "no_subscriptions" }, { status: 400 });
  }

  const payload = JSON.stringify({
    title: "DoIt",
    body: "Тестовое уведомление — труба работает 🎉",
    url: "/",
    tag: "test",
  });

  const results: Array<{ ok: boolean; status?: number; error?: string }> = [];
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      results.push({ ok: true });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      // 404/410 = subscription is dead on the push service side; clean up
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supabase.from("doit_push_subscriptions").delete().eq("id", s.id);
      }
      results.push({ ok: false, status: e.statusCode, error: e.message });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ sent, total: subs.length, results });
}
