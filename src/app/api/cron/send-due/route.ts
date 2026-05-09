import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/env";

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
   moment we send. Both GET and POST are accepted because cron services
   default to one or the other. */
async function diag() {
  const out: Record<string, unknown> = {
    env: {
      cron_secret_len: clean(process.env.CRON_SECRET).length,
      supabase_url_len: clean(process.env.NEXT_PUBLIC_SUPABASE_URL).length,
      service_role_len: clean(process.env.SUPABASE_SERVICE_ROLE_KEY).length,
      vapid_pub_len: clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY).length,
      vapid_priv_len: clean(process.env.VAPID_PRIVATE_KEY).length,
      vapid_subject: clean(process.env.VAPID_SUBJECT) || "(default)",
    },
  };

  try {
    const mod = await import("web-push");
    out.webpush_import = "ok";
    try {
      const subjectRaw = clean(process.env.VAPID_SUBJECT) || "mailto:noreply@doit-tracker.app";
      const subject =
        subjectRaw.startsWith("mailto:") || subjectRaw.startsWith("https://")
          ? subjectRaw
          : `mailto:${subjectRaw}`;
      mod.default.setVapidDetails(
        subject,
        clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        clean(process.env.VAPID_PRIVATE_KEY),
      );
      out.webpush_setvapid = "ok";
    } catch (e) {
      out.webpush_setvapid = `failed: ${e instanceof Error ? e.message : String(e)}`;
    }
  } catch (e) {
    out.webpush_import = `failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  try {
    const url = getSupabaseUrl() ?? "";
    const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!url || !key) {
      out.supabase_client = "skipped (missing env)";
    } else {
      const admin = createServiceClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await admin.from("tasks").select("id").limit(1);
      out.supabase_client = error ? `query_failed: ${error.message}` : "ok";
      out.supabase_url_sanitized_len = url.length;
    }
  } catch (e) {
    out.supabase_client = `failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(out);
}

async function handle(req: NextRequest) {
  const cronSecret = clean(process.env.CRON_SECRET);
  if (!cronSecret) {
    return NextResponse.json({ error: "cron_secret_missing" }, { status: 500 });
  }
  const authHeader = (req.headers.get("authorization") ?? "").trim();
  const queryToken = req.nextUrl.searchParams.get("token") ?? "";
  const expected = `Bearer ${cronSecret}`;
  const ok = authHeader === expected || queryToken.trim() === cronSecret;
  if (!ok) {
    // Give the operator enough to spot which side has the typo without
    // leaking the secret itself.
    const headerHint = authHeader
      ? `len=${authHeader.length} prefix="${authHeader.slice(0, 7)}…"`
      : "missing";
    return NextResponse.json(
      {
        error: "unauthorized",
        header: headerHint,
        expected_len: expected.length,
        secret_len: cronSecret.length,
      },
      { status: 401 },
    );
  }

  const supabaseUrl = getSupabaseUrl() ?? "";
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

  let webpush: typeof import("web-push");
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

  const now = new Date();
  const nowIso = now.toISOString();
  const todayUtc = nowIso.slice(0, 10);
  const todayUtcStartIso = `${todayUtc}T00:00:00Z`;
  const nowUtcTime = nowIso.slice(11, 19); // "HH:MM:SS" in UTC

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

  // ── Digest pass: users whose scheduled time has passed today and who
  //    haven't been sent today's digest yet. Filter in JS because the
  //    "lexicographic time string compare" stays correct only when the
  //    schedule isn't in the wrap-around region — for a tiny user count
  //    (~10) the in-memory filter is cheaper than getting cute in SQL.
  const { data: prefRows, error: prefErr } = await admin
    .from("doit_user_prefs")
    .select("user_id, digest_at_utc, digest_last_sent_at")
    .not("digest_at_utc", "is", null);
  if (prefErr) {
    return NextResponse.json({ error: `prefs_fetch: ${prefErr.message}` }, { status: 500 });
  }
  const dueDigests = (prefRows ?? []).filter((p) => {
    if (!p.digest_at_utc) return false;
    if (p.digest_last_sent_at && p.digest_last_sent_at >= todayUtcStartIso) return false;
    // Compare HH:MM:SS strings — both formatted identically.
    return p.digest_at_utc <= nowUtcTime;
  });

  // Collect every user id we'll touch this tick so we fetch subscriptions
  // once instead of per-user.
  const allUserIds = Array.from(
    new Set([
      ...(dueTasks ?? []).map((t) => t.user_id),
      ...dueDigests.map((p) => p.user_id),
    ]),
  );

  let subsByUser = new Map<string, Array<{ id: string; endpoint: string; p256dh: string; auth: string }>>();
  if (allUserIds.length > 0) {
    const { data: subs, error: subErr } = await admin
      .from("doit_push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", allUserIds);
    if (subErr) {
      return NextResponse.json({ error: `sub_fetch: ${subErr.message}` }, { status: 500 });
    }
    for (const s of subs ?? []) {
      const list = subsByUser.get(s.user_id) ?? [];
      list.push(s);
      subsByUser.set(s.user_id, list);
    }
  }

  let sent = 0;
  let failed = 0;
  let digestSent = 0;
  const deadSubIds: string[] = [];

  async function fanout(
    userId: string,
    payload: string,
  ): Promise<{ ok: number; fail: number }> {
    const userSubs = subsByUser.get(userId) ?? [];
    let ok = 0;
    let fail = 0;
    for (const s of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        ok++;
      } catch (err: unknown) {
        const e = err as { statusCode?: number; message?: string };
        fail++;
        if (e.statusCode === 404 || e.statusCode === 410) {
          deadSubIds.push(s.id);
        }
      }
    }
    return { ok, fail };
  }

  // Per-task reminder pass.
  for (const task of (dueTasks ?? [])) {
    /* iOS already prints the app's manifest name above each push, so a
       title of "DoIt" would just repeat what the OS shows. Use the task
       title itself as the headline instead. */
    const payload = JSON.stringify({
      title: task.title,
      url: "/",
      tag: `task-${task.id}`,
    });
    const r = await fanout(task.user_id, payload);
    sent += r.ok;
    failed += r.fail;
    // Mark even if no devices were subscribed — otherwise the row would
    // re-trigger on every cron tick forever.
    await admin
      .from("tasks")
      .update({ reminded_at: nowIso })
      .eq("id", task.id);
  }

  // Daily digest pass.
  for (const pref of dueDigests) {
    // Pull the user's open tasks for today: due in the past, due today,
    // or do_today flagged. Cap at 50 — the digest only previews titles.
    const { data: userTasks } = await admin
      .from("tasks")
      .select("title, due_date, do_today, created_at")
      .eq("user_id", pref.user_id)
      .is("completed_at", null)
      .or(`due_date.lte.${todayUtc},do_today.eq.true`)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(50);

    const tasks = userTasks ?? [];
    if (tasks.length > 0) {
      const preview = tasks.slice(0, 2).map((t) => t.title).join(", ");
      const more = tasks.length > 2 ? ` +${tasks.length - 2}` : "";
      const payload = JSON.stringify({
        title: `Сегодня · ${tasks.length}`,
        body: preview + more,
        url: "/",
        tag: `digest-${todayUtc}`,
      });
      const r = await fanout(pref.user_id, payload);
      digestSent += r.ok;
      failed += r.fail;
    }
    // Always stamp last_sent — even if 0 tasks today — so we don't
    // re-evaluate this user every 5 minutes for the rest of the day.
    await admin
      .from("doit_user_prefs")
      .update({ digest_last_sent_at: nowIso })
      .eq("user_id", pref.user_id);
  }

  if (deadSubIds.length) {
    await admin.from("doit_push_subscriptions").delete().in("id", deadSubIds);
  }

  return NextResponse.json({
    checked_at: nowIso,
    due: dueTasks?.length ?? 0,
    sent,
    digest_due: dueDigests.length,
    digest_sent: digestSent,
    failed,
    pruned: deadSubIds.length,
  });
}

async function safe(req: NextRequest) {
  try {
    // Auth-gated diag mode: ?diag=1&token=<CRON_SECRET> returns the
    // server's view of env vars, web-push init, and a tiny supabase
    // ping — without sending any notifications.
    if (req.nextUrl.searchParams.get("diag") === "1") {
      const cronSecret = clean(process.env.CRON_SECRET);
      const queryToken = (req.nextUrl.searchParams.get("token") ?? "").trim();
      if (cronSecret && queryToken === cronSecret) {
        return await diag();
      }
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return await handle(req);
  } catch (e) {
    const m = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error("cron fatal:", e);
    return NextResponse.json({ error: `fatal: ${m}` }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return safe(req);
}

export async function POST(req: NextRequest) {
  return safe(req);
}
