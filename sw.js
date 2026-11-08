const CACHE_VERSION = 'jiheng-static-v1';
const CACHE_NAME = CACHE_VERSION;
const PRECACHE_URLS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(PRECACHE_URLS.map(url => cache.add(url).catch(err => console.warn('[SW] precache miss:', url))));
      await self.skipWaiting();
    } catch (err) { console.error('[SW] install failed:', err); }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => {
        if (key !== CACHE_NAME && key.startsWith('jiheng-static-')) return caches.delete(key);
      }));
      await self.clients.claim();
    } catch (err) { console.error('[SW] activate failed:', err); }
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  
  const path = url.pathname.toLowerCase();
  const isHtml = req.mode === 'navigate' || path.endsWith('.html') || path.endsWith('/');
  const isManifest = path.endsWith('.json') && path.endsWith('manifest.json');
  const isIcon = path.endsWith('.png') || path.endsWith('.ico') || path.endsWith('.svg');
  const isScript = path.endsWith('.js');
  if (!isHtml && !isManifest && !isIcon && !isScript) return;

  event.respondWith((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true });
      const networkPromise = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
        return res;
      }).catch(() => cached || new Response('Offline', { status: 503 }));

      if (cached) {
        event.waitUntil(networkPromise.catch(() => {}));
        return cached;
      }
      return await networkPromise;
    } catch (err) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      } catch (e) {}
      return new Response('Offline', { status: 503 });
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
