import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/[\r\n]/g, "");
}

/* External cron (cron-job.org) hits this every 5 minutes with header
   `Authorization: Bearer <CRON_SECRET>`. We look up tasks whose
   remind_at has passed and that haven't been reminded yet, fan out a
   push to every subscription the owning user has, and mark them as
   reminded so the next run skips them. Idempotent across overlapping
   runs because we filter on `reminded_at IS NULL` and stamp it the
   moment we send. */
export async function POST(req: NextRequest) {
  const cronSecret = clean(process.env.CRON_SECRET);
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_secret_missing" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "supabase_env_missing" }, { status: 500 });
  }

  const publicKey = clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  const privateKey = clean(process.env.VAPID_PRIVATE_KEY);
  const subjectRaw = clean(process.env.VAPID_SUBJECT) || "mailto:noreply@doit-tracker.app";
  const subject =
    subjectRaw.startsWith("mailto:") || subjectRaw.startsWith("https://")
      ? subjectRaw
      : `mailto:${subjectRaw}`;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "vapid_missing" }, { status: 500 });
  }

  let webpush;
  try {
    const mod = await import("web-push");
    webpush = mod.default;
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (e) {
    const m = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return NextResponse.json({ error: `webpush_init: ${m}` }, { status: 500 });
  }

  // Service-role client — bypasses RLS so the cron job can read across
  // all users. Only this route uses it; everything else goes through the
  // user-scoped SSR client.
  const admin = createServiceClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const nowIso = new Date().toISOString();

  const { data: dueTasks, error: dueErr } = await admin
    .from("tasks")
    .select("id, user_id, title, remind_at")
    .lte("remind_at", nowIso)
    .is("reminded_at", null)
    .is("completed_at", null)
    .limit(200);
  if (dueErr) {
    return NextResponse.json({ error: `due_fetch: ${dueErr.message}` }, { status: 500 });
  }
  if (!dueTasks || dueTasks.length === 0) {
    return NextResponse.json({ checked_at: nowIso, due: 0, sent: 0 });
  }

  const userIds = Array.from(new Set(dueTasks.map((t) => t.user_id)));
  const { data: subs, error: subErr } = await admin
    .from("doit_push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (subErr) {
    return NextResponse.json({ error: `sub_fetch: ${subErr.message}` }, { status: 500 });
  }

  const subsByUser = new Map<string, typeof subs>();
  for (const s of subs ?? []) {
    const list = subsByUser.get(s.user_id) ?? [];
    list.push(s);
    subsByUser.set(s.user_id, list);
  }

  let sent = 0;
  let failed = 0;
  const deadSubIds: string[] = [];

  for (const task of dueTasks) {
    const userSubs = subsByUser.get(task.user_id) ?? [];
    const payload = JSON.stringify({
      title: "DoIt",
      body: task.title,
      url: "/",
      tag: `task-${task.id}`,
    });
    for (const s of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        failed++;
        if (e.statusCode === 404 || e.statusCode === 410) {
          deadSubIds.push(s.id);
        }
      }
    }
    // Mark even if no devices were subscribed — otherwise the row would
    // re-trigger on every cron tick forever.
    await admin
      .from("tasks")
      .update({ reminded_at: nowIso })
      .eq("id", task.id);
  }

  if (deadSubIds.length) {
    await admin.from("doit_push_subscriptions").delete().in("id", deadSubIds);
  }

  return NextResponse.json({
    checked_at: nowIso,
    due: dueTasks.length,
    sent,
    failed,
    pruned: deadSubIds.length,
  });
}
