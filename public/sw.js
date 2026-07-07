// Elevanthe CRM — Service Worker
// Estratégia: Network First para páginas, Cache First para assets estáticos

const CACHE_NAME = "elevanthe-crm-v4";
const STATIC_CACHE = "elevanthe-static-v4";

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

  // Chunks JS/CSS do Next.js: sempre network (nunca cachear — mudam a cada deploy)
  if (url.pathname.startsWith("/_next/")) return;

  // Assets estáticos (imagens públicas, fontes): Cache First
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2|woff)$/)) {
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

// ── Push: recebe notificação do servidor ─────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Elevanthe CRM", body: "Nova atualização disponível.", url: "/dashboard", icon: "/pwa-icon-192.png", badge: "/pwa-icon-192.png", type: "info" };

  try {
    if (event.data) data = { ...data, ...JSON.parse(event.data.text()) };
  } catch (_) {}

  // Cor do badge por tipo de notificação
  const tagMap = { maintenance: "maintenance", promo: "promo", warning: "warning", info: "info" };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/pwa-icon-192.png",
      badge: data.badge || "/pwa-icon-192.png",
      tag: tagMap[data.type] || "info",
      data: { url: data.url || "/dashboard" },
      requireInteraction: data.type === "maintenance" || data.type === "warning",
      vibrate: [200, 100, 200],
    })
  );
});

// ── Notification click: abre a URL correta ao clicar ─────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma aba aberta, foca nela e navega
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Senão abre uma nova aba
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
