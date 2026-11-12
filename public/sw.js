// HikaruStore Offline PWA Service Worker
const CACHE_NAME = 'hikarustore-cache-v3';

const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icon.png',
  '/icon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('Precache failed for some assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for navigation, Cache-first for static scripts and styles
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests, cross-origin requests, and browser extensions
  if (
    request.method !== 'GET' ||
    !url.protocol.startsWith('http') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Skip API routes and Next.js RSC / prefetch payloads so dynamic navigations never fail
  if (
    url.pathname.startsWith('/api/') ||
    request.headers.get('RSC') === '1' ||
    url.searchParams.has('_rsc')
  ) {
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
          // Fallback to cached root or POS if specific route not cached
          const fallback = (await caches.match('/vi/pos')) || (await caches.match('/'));
          return fallback || new Response('Bạn đang ngoại tuyến. Vui lòng kiểm tra lại kết nối mạng.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Default: Network with Cache Fallback (never resolve to undefined)
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
