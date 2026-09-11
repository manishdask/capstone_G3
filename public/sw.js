// SGH HMS — Service Worker (sw.js)
// Provides asset caching for PWA support.
// Strategy: Cache-first for static assets, network-first for API/dynamic content.

const CACHE_NAME = "sgh-hms-v1.0.1";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json"
];

// -----------------------------------------------
// INSTALL: Pre-cache core shell
// -----------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SGH SW] Pre-caching app shell");
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// -----------------------------------------------
// ACTIVATE: Clean up old caches
// -----------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SGH SW] Removing old cache:", name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// -----------------------------------------------
// FETCH: Cache-first with network fallback
// -----------------------------------------------
self.addEventListener("fetch", (event) => {
  // Skip non-GET and cross-origin requests (the backend API lives on a
  // different origin/port and must never be served from this cache).
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // For navigation requests: network-first, fallback to cached /index.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/index.html").then((cached) => cached || new Response("Offline"))
      )
    );
    return;
  }

  // For static assets: cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache successful same-origin responses
        if (!response || response.status !== 200 || response.type === "opaque") {
          return response;
        }

        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });

        return response;
      }).catch(() => {
        // Return offline fallback for image/font requests
        if (event.request.destination === "image") {
          return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#F5F6F2"/></svg>`,
            { headers: { "Content-Type": "image/svg+xml" } }
          );
        }
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
