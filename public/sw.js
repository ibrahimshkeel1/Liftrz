const CACHE_NAME = 'Liftrz-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg'
];

// Precache core shell on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  const url = new URL(event.request.url);
  const isNavigate = event.request.mode === 'navigate';
  const isAsset = /\.(js|css|svg|png|jpg|jpeg|gif|webp|woff2?|ico)$/i.test(url.pathname);
  const isHtml = url.pathname.endsWith('.html') || url.pathname === '/';

  // SPA navigation: network first, fallback to cached root only when offline
  if (isNavigate || isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cached root page in background
          if (url.pathname === '/') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/').then((cached) => {
            if (cached) return cached;
            return new Response('Offline. Please check your connection.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        })
    );
    return;
  }

  // Static assets: cache first, then network
  if (isAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else (e.g. SEO routes): network first, no caching
  event.respondWith(
    fetch(event.request).catch(() => caches.match('/'))
  );
});
