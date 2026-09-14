/* =========================================================================
   Jiheng Service Worker
   -----------------------------------------------------------------------
   职责：
   - 静态资源缓存（HTML / manifest / 图标）
   - 离线基础支持
   - 版本更新检测
   - 旧缓存自动清理

   绝不缓存用户金融数据：
   - 用户数据在 localStorage 里，Service Worker 不碰
   - 只缓存 App 本身（HTML / 图标 / manifest）
   ========================================================================= */

const CACHE_VERSION = 'jiheng-static-v1';
const CACHE_NAME = CACHE_VERSION;

/* 需要预缓存的静态资源（相对于 sw.js 所在目录） */
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

/* ---------- install：预缓存 ---------- */
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        // 逐个尝试缓存，失败不阻塞安装（图标可能还没准备好）
        await Promise.all(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => {
              console.warn('[SW] precache miss:', url, err && err.message);
            })
          )
        );
        // 立即激活新版本
        await self.skipWaiting();
      } catch (err) {
        console.error('[SW] install failed:', err);
      }
    })()
  );
});

/* ---------- activate：清理旧缓存 ---------- */
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME && key.startsWith('jiheng-static-')) {
              return caches.delete(key);
            }
          })
        );
        // 立即接管所有客户端
        await self.clients.claim();
      } catch (err) {
        console.error('[SW] activate failed:', err);
      }
    })()
  );
});

/* ---------- fetch：缓存优先 + 后台更新 ---------- */
self.addEventListener('fetch', event => {
  const req = event.request;

  // 只处理 GET
  if (req.method !== 'GET') return;

  // 只处理同源请求（不缓存第三方）
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 跳过非 HTML / manifest / 图标的请求
  // 例如 .json 备份文件、下载等不应走缓存
  const path = url.pathname.toLowerCase();
  const isHtml = req.mode === 'navigate' || path.endsWith('.html') || path.endsWith('/');
  const isManifest = path.endsWith('.json') && path.endsWith('manifest.json');
  const isIcon = path.endsWith('.png') || path.endsWith('.ico') || path.endsWith('.svg');
  const isScript = path.endsWith('.js');

  if (!isHtml && !isManifest && !isIcon && !isScript) return;

  event.respondWith(
    (async () => {
      try {
        // 先看缓存
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req, { ignoreSearch: true });

        // 后台更新（stale-while-revalidate）
        const networkPromise = fetch(req)
          .then(res => {
            // 只缓存成功的响应
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put(req, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(err => {
            // 网络失败：如果缓存里有，返回缓存
            return cached || new Response('Offline', { status: 503 });
          });

        // 有缓存就先返回缓存，同时后台更新
        if (cached) {
          event.waitUntil(networkPromise.catch(() => {}));
          return cached;
        }

        // 没缓存就等网络
        return await networkPromise;
      } catch (err) {
        console.error('[SW] fetch failed:', err);
        // 兜底：尝试从缓存拿 index.html
        try {
          const cache = await caches.open(CACHE_NAME);
          const fallback = await cache.match('./index.html');
          if (fallback) return fallback;
        } catch (e) {}
        return new Response('Offline', { status: 503 });
      }
    })()
  );
});

/* ---------- message：支持页面触发 skipWaiting ---------- */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
