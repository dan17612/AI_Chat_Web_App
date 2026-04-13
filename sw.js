// ============================================
// AI Chat Pro Client – Service Worker (PWA)
// Stale-while-revalidate + update notification.
// ============================================

const CACHE_NAME = "ai-chat-pro-v5";

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
  "./icons/icon192.png",
  "./icons/icon512.png",
  "./i18n.js",
  "./storage.js",
  "./announcement.js",
];

// Install: precache assets, don't activate yet (wait for user confirm)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
});

// Activate: delete old caches, notify all tabs
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    )
  );
});

// Listen for "SKIP_WAITING" message from the page
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
