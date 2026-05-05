"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // First, unregister any previously registered SW so a stale cached
    // version can't keep serving old content during the debugging phase.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))))
      .then(() => navigator.serviceWorker.register("/sw.js"))
      .catch(() => {
        // SW registration failures shouldn't block the app.
      });
  }, []);
  return null;
}
