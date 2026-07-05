// Elevanthe CRM — Service Worker
// Estratégia: Network First para páginas, Cache First para assets estáticos

const CACHE_NAME = "elevanthe-crm-v1";
const STATIC_CACHE = "elevanthe-static-v1";

// Assets que devem ser cacheados imediatamente (app shell)
const APP_SHELL = [
  "/",
  "/sign-in",
  "/manifest.json",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/elevanthe-icon.png",
  "/favicon.ico",
];

// ── Install: pré-cacheia o app shell ──────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpa caches antigos ───────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: estratégias por tipo de recurso ───────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests não-GET e de outras origens
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API routes: sempre network, sem cache
  if (url.pathname.startsWith("/api/")) return;

  // Assets estáticos (_next/static, imagens públicas): Cache First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2|woff)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Páginas HTML: Network First, fallback para cache
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/sign-in")))
    );
    return;
  }
});
