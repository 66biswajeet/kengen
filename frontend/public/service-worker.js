/* AquaServe PWA — service worker
 * Strategy: app-shell precache + network-first for API + cache-first for static assets.
 */
const SW_VERSION = "aquaserve-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SW_VERSION).then((c) => c.addAll(APP_SHELL).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SW_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isAPI = url.pathname.startsWith("/api/");
  const isStatic = /\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$/.test(url.pathname);

  if (isAPI) {
    // Network-first for API — always fresh; fallback to cache when offline
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(SW_VERSION).then((c) => c.put(req, clone)).catch(() => {});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  if (isStatic) {
    // Cache-first for static
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(SW_VERSION).then((c) => c.put(req, clone)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // For navigation requests, respond with the index shell (SPA offline support)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
  }
});
