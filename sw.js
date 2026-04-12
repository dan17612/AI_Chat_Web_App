// ============================================
// AI Chat Pro Client – Service Worker (PWA)
// Cache-first strategy for all web-app assets.
// ============================================

const CACHE_NAME = "ai-chat-pro-v2";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./settings.html",
  "./style.css",
  "./settings.css",
  "./app.js",
  "./settings.js",
  "./api.js",
  "./manifest.webmanifest",
  "./icons/icon16.png",
  "./icons/icon48.png",
  "./icons/icon128.png",
  "./i18n.js",
  "./storage.js",
  "./announcement.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle same-origin GET requests; pass through cross-origin API calls
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
