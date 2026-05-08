"use client";

/* Client-side Web Push helpers. The SW is registered separately
   (RegisterSW.tsx); this file only handles user-initiated subscribe /
   unsubscribe and feeds the result to our /api/push routes. */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export type PushEnableResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" | "no_vapid" | "no_notification_api" | "server" | "unknown"; raw?: string };

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    typeof Notification !== "undefined"
  );
}

export async function isPushEnabled(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

export async function enablePush(): Promise<PushEnableResult> {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };
  if (typeof Notification === "undefined" || !Notification.requestPermission) {
    return { ok: false, reason: "no_notification_api" };
  }
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return { ok: false, reason: "no_vapid" };

  // Ask for permission first, before any other awaits, so iOS keeps the
  // user-gesture context that the prompt requires.
  let perm: NotificationPermission;
  try {
    perm = await Notification.requestPermission();
  } catch (e) {
    return {
      ok: false,
      reason: "unknown",
      raw: "requestPermission threw: " + (e instanceof Error ? e.message : String(e)),
    };
  }
  if (perm !== "granted") return { ok: false, reason: "denied" };

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const key = urlBase64ToUint8Array(publicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // PushManager wants an ArrayBuffer-backed view; the strict TS lib
        // types require an explicit narrow.
        applicationServerKey: key.buffer.slice(
          key.byteOffset,
          key.byteOffset + key.byteLength,
        ) as ArrayBuffer,
      });
    }
    const json = sub.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        user_agent: navigator.userAgent,
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, reason: "server", raw: `${res.status} ${txt}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: "unknown",
      raw: "subscribe threw: " + (e instanceof Error ? `${e.name}: ${e.message}` : String(e)),
    };
  }
}

export async function disablePush(): Promise<{ ok: boolean }> {
  if (!(await isPushSupported())) return { ok: true };
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function sendTestPush(): Promise<{ ok: boolean; raw?: string }> {
  try {
    const res = await fetch("/api/push/test", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, raw: json.error || String(res.status) };
    return { ok: true };
  } catch (e) {
    return { ok: false, raw: e instanceof Error ? e.message : String(e) };
  }
}
