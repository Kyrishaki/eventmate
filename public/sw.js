// HikaruStore Offline PWA Service Worker
const CACHE_NAME = 'hikarustore-cache-v6-hikaru-ui';

const STATIC_PRECACHE = [
  '/',
  '/vi/pos',
  '/vi/pos/orders',
  '/vi/pos/sync',
  '/vi/dashboard',
  '/vi/dashboard/products',
  '/vi/dashboard/inventory',
  '/vi/dashboard/orders',
  '/manifest.json',
  '/logo.png',
  '/offline-transfer-qr.png',
  '/icon.png',
  '/icon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/products/anime-figure-popup.svg',
  '/products/banner-color-fiesta.svg',
  '/products/banner-hobby-horizon-hn.svg',
  '/products/banner-hobby-horizon.svg',
  '/products/limbus-collab-set.svg',
  '/products/limbus-diorama-mephi.svg',
  '/products/limbus-figure-chibi.svg',
  '/products/limbus-keychain-sinners.svg',
  '/products/limbus-shaker-keychain.svg',
  '/products/limbus-standee-ego.svg',
];

// Install: precache essential shell routes and static assets individually so one 404/redirect never aborts caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await Promise.all(
          STATIC_PRECACHE.map(async (assetUrl) => {
            try {
              const res = await fetch(assetUrl);
              if (res && res.status === 200) {
                await cache.put(assetUrl, res);
              }
            } catch (err) {
              console.warn('Precache skipped for asset:', assetUrl, err);
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigation/RSC/VietQR, Cache-first for static scripts, styles, and images
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Allow caching VietQR dynamic images (Network-first with Cache Fallback)
  if (url.origin === 'https://img.vietqr.io') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response('', { status: 504 });
        })
    );
    return;
  }

  // Skip other cross-origin requests and API routes
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // Next.js RSC / client-side navigation payloads -> Network-first with Cache Fallback
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response('', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        })
    );
    return;
  }

  // Static assets (Next.js chunks, fonts, images) -> Cache-first with Network Fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => cached || new Response('', { status: 504 }));
      })
    );
    return;
  }

  // Navigation requests (HTML pages) -> Network-first with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback to cached POS or root if specific route not cached
          const fallback = (await caches.match('/vi/pos')) || (await caches.match('/'));
          return (
            fallback ||
            new Response('Bạn đang ngoại tuyến. Vui lòng kiểm tra lại kết nối mạng.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        })
    );
    return;
  }

  // Default: Network with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response('', { status: 504 });
      })
  );
});
