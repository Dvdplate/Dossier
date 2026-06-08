const CACHE_VERSION = 'dossier-v4';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/emblem.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
    )).then(() => {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: { code: 'offline', message: 'Offline' } }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  const isAsset = url.pathname.startsWith('/assets/');
  const isShell = url.pathname === '/' || url.pathname === '/index.html';
  const isNavigate = event.request.mode === 'navigate';

  if (isNavigate || isAsset || isShell) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(() => offlineFallback(request));
}

function offlineFallback(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;

    if (request.mode === 'navigate' || isShellRequest(request)) {
      return caches.match('/index.html').then(
        (html) => html || caches.match('/offline.html')
      );
    }

    return caches.match('/offline.html');
  });
}

function isShellRequest(request) {
  const path = new URL(request.url).pathname;
  return path === '/' || path === '/index.html';
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE_VERSION).then(async (cache) => {
    const cached = await cache.match(request);
    const networkPromise = fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => null);

    if (cached) {
      networkPromise.catch(() => {});
      return cached;
    }

    const network = await networkPromise;
    return network || new Response('', { status: 404 });
  });
}
