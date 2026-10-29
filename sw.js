// Saryarqa Go offline support. Network first (online you always get the latest version),
// the saved copy when there is no connection: the phrasebook, My trip and the Trip Pass
// keep working in the mountains. The video is never cached (large, range requests).
const CACHE = 'sg-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])).catch(() => {}));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin || r.url.endsWith('.mp4')) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(r, copy));
        }
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || caches.match('./index.html'))),
  );
});
