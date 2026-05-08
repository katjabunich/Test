"use client";

import { useEffect } from "react";

/* Register the service worker once. We deliberately do NOT unregister
   on each load anymore — push subscriptions live on the registration,
   so wiping it would silently break notifications. */
export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failures shouldn't block the app.
    });
  }, []);
  return null;
}
