const CACHE_NAME = "fotw-offline-v2";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./data.js",
  "./territories.js",
  "./script.js",
  "./quiz.js",
  "./map.js",
];
const REMOTE_ASSETS = [
  "https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl.css",
  "https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl.mjs",
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_ASSETS);
    await Promise.allSettled(REMOTE_ASSETS.map(async (url) => {
      const response = await fetch(url, { mode: "cors" });
      if (response.ok || response.type === "opaque") {
        await cache.put(url, response);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("fotw-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  const isAppAsset = url.origin === scopeUrl.origin && url.pathname.startsWith(scopeUrl.pathname);
  const isRemoteAsset = REMOTE_ASSETS.includes(url.href);
  if (!isAppAsset && !isRemoteAsset) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached && (isRemoteAsset || !isAppAsset)) return cached;

    try {
      const response = await fetch(request);
      if (response.ok || response.type === "opaque") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      if (request.mode === "navigate") {
        const appShell = await caches.match(new URL("index.html", scopeUrl).href);
        if (appShell) return appShell;
      }
      return new Response("This resource is not available offline.", {
        status: 503,
        statusText: "Offline",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});
