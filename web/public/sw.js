// Offline support: keep the app, its photos and the map tiles already viewed, so the plan opens
// without signal. Own files: show the cached copy at once and refresh it in the background.
const V = 'tw2026-app-v1', TILES = 'tw2026-tiles', MAX_TILES = 600;
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['./', './index.html', './manifest.webmanifest']))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== TILES).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// the page sends the list of files it loaded (hashed JS/CSS, photos) so they are saved too
self.addEventListener('message', e => {
  const urls = e.data && e.data.cache;
  if (Array.isArray(urls)) e.waitUntil(caches.open(V).then(c => Promise.all(urls.filter(u => u.startsWith(self.location.origin)).map(u => c.match(u).then(hit => hit || c.add(u)).catch(() => {})))));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname === 'server.arcgisonline.com') e.respondWith(tile(r));
  else if (u.origin === self.location.origin || /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) e.respondWith(fresh(e, r));
});
async function fresh(e, r) {
  const c = await caches.open(V);
  const nav = r.mode === 'navigate';
  const hit = await c.match(nav ? './index.html' : r, { ignoreSearch: nav });
  const net = fetch(r).then(res => { if (res.ok) c.put(nav ? './index.html' : r, res.clone()); return res; });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net.catch(() => Response.error());
}
let trimming = false;
async function tile(r) {
  const c = await caches.open(TILES), hit = await c.match(r);
  if (hit) return hit;
  try {
    const res = await fetch(r);
    c.put(r, res.clone()).then(() => { if (!trimming) { trimming = true; c.keys().then(ks => Promise.all(ks.slice(0, Math.max(0, ks.length - MAX_TILES)).map(k => c.delete(k)))).finally(() => { trimming = false; }); } });
    return res;
  } catch { return Response.error(); }
}
