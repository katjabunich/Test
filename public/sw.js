/* No-op service worker. Previous deploy registered a SW that cached pages;
   this minimal version unregisters caches and stays out of the way during
   debugging. After /diag confirms env vars are correct, we can put a real
   caching strategy back. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

// Intentionally no fetch handler — every request goes straight to the network.
