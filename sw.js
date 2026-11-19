// Offline cache for THE RUNDOWN. Bump VERSION after changing any file.
// Online team play still needs a connection; everything else works offline.
const VERSION = "rundown-v10";
const CORE = [
  "./", "index.html", "style.css", "sprites.js", "portraits.js", "data.js", "rpg.js", "bank.js",
  "q-gk.js", "q-nz.js", "q-geo.js", "q-sci.js", "q-sport.js", "q-ent.js", "q-hist.js", "q-hp.js",
  "flags.js", "sfx.js", "studio.js", "engine.js", "net.js", "pub.js", "ui.js",
  "manifest.json", "icon.svg", "icon-192.png", "icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("rundown-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.hostname.endsWith("supabase.co")) return;
  // fonts and the supabase library: cache-first
  if (url.hostname.includes("fonts.g") || url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(e.request); if (hit) return hit;
      const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // app files: network-first so updates land, cache when offline
  // no-cache: always check GitHub for a newer file instead of trusting the 10-minute browser cache
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
