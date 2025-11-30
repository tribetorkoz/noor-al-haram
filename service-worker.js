const CACHE_NAME = 'noor-al-haram-v3-fix';
const urlsToCache = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control of all clients immediately
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);

  // 1. Navigation Requests (Opening the app, refreshing)
  // We want to serve index.html for ANY navigation to support SPA routing
  // and to prevent 404s if the server doesn't handle the route.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network returns 404 or error, fallback to cache
          if (!response || response.status === 404 || response.type === 'error') {
            return caches.match('./index.html');
          }
          return response;
        })
        .catch(() => {
          // If offline (network fails completely), fallback to cache
          return caches.match('./index.html');
        })
    );
    return;
  }

  // 2. Asset Requests (Images, Scripts, JSON)
  // Stale-While-Revalidate Strategy for best performance
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response immediately if found
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Update cache with new version if network succeeds
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then((cache) => {
               cache.put(event.request, responseToCache);
             });
          }
          return networkResponse;
        }).catch(() => {
           // Network failed, do nothing (we already returned cache if available)
        });

        return cachedResponse || fetchPromise;
      })
  );
});