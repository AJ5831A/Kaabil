/* KAABIL service worker — offline shell + lessons.
 * - Precache: shell routes and the offline page.
 * - /_next/static, fonts, icons: stale-while-revalidate (covers lesson content chunks).
 * - Page navigations: network-first, fall back to cache, then /offline.
 * - Never cache: non-GET, /api/admin/*, /admin/*, /api/saathi, /api/tts, /api/transcribe.
 */
const VERSION = "kaabil-v1";
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const PRECACHE = ["/", "/welcome", "/learn", "/discover", "/jobs", "/parchi", "/offline", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" }))))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

const NEVER = [/^\/api\/admin/, /^\/admin/, /^\/api\/saathi/, /^\/api\/tts/, /^\/api\/transcribe/, /^\/api\/interest/, /^\/api\/report/, /^\/api\/parchi/, /^\/api\/events/];

async function staleWhileRevalidate(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  const net = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || net;
}

async function networkFirst(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (await caches.match(req)) || (await caches.match("/offline")) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER.some((r) => r.test(url.pathname))) return;

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/") || /\.(woff2?|ttf|otf)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  // Public read APIs (jobs, training, stations): network-first so data stays fresh but works offline.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req));
    return;
  }
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(req));
  }
});
