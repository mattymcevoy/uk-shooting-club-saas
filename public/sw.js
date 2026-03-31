const CACHE_NAME = 'uksc-offline-cache-v1';

const OFFLINE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
});

self.addEventListener('fetch', (event) => {
  // Offline Check-in tracking fallback logic
  // Automatically fallback to cache if network request fails (useful for deep-woods shooting ranges)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checkins') {
    // When connectivity returns, we could flush IndexedDB saved check-ins here.
    console.log('Background Syncing Range Check-ins...');
  }
});
