// Self-Destruct Service Worker
// Version: KILL_SWITCH_V2

self.addEventListener('install', (event) => {
    console.log('SW: Kill switch installed.');
    // Activate immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('SW: Kill switch activated. Purging caches...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('SW: Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            console.log('SW: Caches purged. Claiming clients...');
            return self.clients.claim();
        }).then(() => {
            console.log('SW: Unregistering self...');
            return self.registration.unregister();
        }).then(() => {
            console.log('SW: Unregistered. Force reloading clients...');
            return self.clients.matchAll();
        }).then((clients) => {
            clients.forEach(client => client.navigate(client.url));
        })
    );
});

// Intercept all fetches and strictly go to network to bypass any zombie caches
self.addEventListener('fetch', (event) => {
    // Do not cache anything. Pass through.
    event.respondWith(fetch(event.request));
});
