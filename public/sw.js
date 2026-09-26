// SGH HMS — Service Worker (sw.js)
// Provides asset caching for PWA support.
//
// WHAT IT MAY CACHE: only Vite's fingerprinted build output (/build/assets/*)
// and the manifest. Those files are immutable — a new build gets new names —
// so serving them cache-first can never show stale code.
//
// WHAT IT MUST NEVER TOUCH: /api/*. The API shares this origin, and the Cache
// API keys entries by URL alone, ignoring the Authorization header. Caching
// /api/auth/me therefore handed the first signed-in user's profile (e.g. an
// Admin) to every later user of the same browser on refresh — a Patient
// reloaded into the Admin shell, and was shown the Admin's cached reports.
// Per-user, per-token data has no place in a shared cache.

// Bumping this name makes `activate` delete every older cache, which is how
// browsers still holding API responses from sgh-hms-v1.0.1 get cleaned up.
const CACHE_NAME = "sgh-hms-v2";

const PRECACHE_ASSETS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function isCacheableAsset(url) {
  return url.pathname.startsWith("/build/assets/") || url.pathname === "/manifest.json";
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept the API — let every request go straight to the network.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  // Navigations always come from the network: the Blade shell names the
  // current build's asset hashes, so a cached copy would pin an old release.
  // The offline fallback is a plain message rather than a stale shell.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response("St George HMS is offline. Reconnect and refresh.", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      )
    );
    return;
  }

  if (!isCacheableAsset(url)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});

// -----------------------------------------------
// PUSH NOTIFICATIONS: Appointment reminders
// -----------------------------------------------
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "SGH Hospital Reminder";
  const options = {
    body: data.body || "You have an upcoming appointment.",
    icon: "/manifest.json",
    badge: "/manifest.json",
    tag: data.tag || "sgh-reminder",
    data: { url: data.url || "/" },
    actions: [
      { action: "view", title: "View Appointment" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "view") {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
