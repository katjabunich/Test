/* Minimal service worker so the app is installable as a PWA.
   v1 has no offline strategy — a future version can add caching. */

const APP_SHELL_CACHE = "tasktracker-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== APP_SHELL_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  // Network-first; SW does not interfere on success.
  // Required so the browser counts this as a real fetch handler (PWA install).
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request)),
  );
});
