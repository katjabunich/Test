import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/[\r\n]/g, "");
}

/* GET = a sanity probe so we can curl/visit the route and confirm
   the latest deploy is live before troubleshooting POST. */
export async function GET() {
  try {
    const mod = await import("web-push");
    return NextResponse.json({
      alive: true,
      webpush: typeof mod.default?.setVapidDetails === "function" ? "loaded" : "missing",
      env: {
        pub_len: clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY).length,
        priv_len: clean(process.env.VAPID_PRIVATE_KEY).length,
        subject_set: !!clean(process.env.VAPID_SUBJECT),
      },
    });
  } catch (e) {
    const m = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return NextResponse.json({ alive: true, error: `import failed: ${m}` }, { status: 500 });
  }
}

export async function POST() {
  try {
    const webpushMod = await import("web-push").catch((e) => {
      throw new Error(`web-push import failed: ${e instanceof Error ? e.message : String(e)}`);
    });
    const webpush = webpushMod.default;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const publicKey = clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
    const privateKey = clean(process.env.VAPID_PRIVATE_KEY);
    const subjectRaw = clean(process.env.VAPID_SUBJECT) || "mailto:noreply@doit-tracker.app";
    const subject =
      subjectRaw.startsWith("mailto:") || subjectRaw.startsWith("https://")
        ? subjectRaw
        : `mailto:${subjectRaw}`;

    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: `vapid_missing (pub=${publicKey.length}, priv=${privateKey.length})` },
        { status: 500 },
      );
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } catch (e) {
      const m = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      return NextResponse.json(
        { error: `vapid_invalid: ${m}` },
        { status: 500 },
      );
    }

    const { data: subs, error } = await supabase
      .from("doit_push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user.id);
    if (error) {
      console.error("push test fetch:", error);
      return NextResponse.json({ error: `fetch_failed: ${error.message}` }, { status: 500 });
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
        if (e.statusCode === 404 || e.statusCode === 410) {
          await supabase.from("doit_push_subscriptions").delete().eq("id", s.id);
        }
        results.push({ ok: false, status: e.statusCode, error: e.message });
      }
    }

    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ sent, total: subs.length, results });
  } catch (e) {
    const m = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error("push test fatal:", e);
    return NextResponse.json({ error: `fatal: ${m}` }, { status: 500 });
  }
}
