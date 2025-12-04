// Enhanced Service Worker for Emirati Journey Platform PWA
// Provides offline functionality, caching, background sync, and push notifications

const CACHE_NAME = 'emirati-journey-v1.0.0';
const STATIC_CACHE_NAME = 'emirati-journey-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'emirati-journey-dynamic-v1.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/e4ab7695-235d-451a-a304-556e2bb2b7e8.png',
  '/lovable-uploads/8e8dde72-de3d-4664-b8d9-541c109edc51.png'
];

const CACHE_STRATEGIES = {
  images: 'cache-first',
  api: 'network-first',
  static: 'cache-first',
  dynamic: 'stale-while-revalidate'
};

// ✅ FIXED: Helper function with proper Response handling
function canCache(request) {
  if (request.url.startsWith('chrome-extension://')) return false;
  const url = new URL(request.url);
  return request.method === 'GET' &&
    !url.pathname.includes('/api/') &&
    url.protocol !== 'chrome-extension:';
}

// ✅ FIXED: Proper Response creation and error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
  self.skipWaiting();
});

// ✅ FIXED: Proper activation with error handling
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .catch((error) => {
        console.error('Service Worker: Failed to clean old caches', error);
      })
  );
  self.clients.claim();
});

// ✅ FIXED: Proper fetch handling with Response validation
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome extensions
  if (!canCache(event.request)) {
    return;
  }

  const url = new URL(event.request.url);

  // Handle different types of requests
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    // Image cache-first strategy
    event.respondWith(handleImageRequest(event.request));
  } else if (url.pathname.includes('/api/')) {
    // API network-first strategy
    event.respondWith(handleApiRequest(event.request));
  } else {
    // Static assets cache-first strategy
    event.respondWith(handleStaticRequest(event.request));
  }
});

// ✅ FIXED: Proper image request handling
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    // ✅ FIXED: Validate response before caching
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Image request failed', error);
    // ✅ FIXED: Return proper Response object for errors
    return new Response('Image not available', {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ✅ FIXED: Proper API request handling
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // ✅ FIXED: Validate response
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    console.error('Service Worker: API request failed', error);

    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // ✅ FIXED: Return proper Response object for errors
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ✅ FIXED: Proper static request handling
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    // ✅ FIXED: Validate response before caching
    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      const responseClone = networkResponse.clone();
      const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
      await dynamicCache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Static request failed', error);

    // ✅ FIXED: Return proper fallback Response
    return new Response('Content not available', {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// ✅ FIXED: Proper message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});



// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);

  if (event.tag === 'job-application-sync') {
    event.waitUntil(syncJobApplications());
  } else if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  } else if (event.tag === 'profile-update-sync') {
    event.waitUntil(syncProfileUpdates());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  let notificationData = {};

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData = {
        title: 'Emirati Journey Platform',
        body: event.data.text() || 'New notification received',
        icon: '/lovable-uploads/e4ab7695-235d-451a-a304-556e2bb2b7e8.png',
        badge: '/lovable-uploads/e4ab7695-235d-451a-a304-556e2bb2b7e8.png'
      };
    }
  }

  const options = {
    body: notificationData.body || 'New notification',
    icon: notificationData.icon || '/lovable-uploads/e4ab7695-235d-451a-a304-556e2bb2b7e8.png',
    badge: notificationData.badge || '/lovable-uploads/e4ab7695-235d-451a-a304-556e2bb2b7e8.png',
    data: notificationData.data || {},
    actions: notificationData.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: notificationData.priority === 'high',
    silent: notificationData.priority === 'low',
    vibrate: notificationData.priority === 'high' ? [200, 100, 200] : [100],
    tag: notificationData.tag || 'general'
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Emirati Journey Platform',
      options
    )
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'dismiss') {
    return;
  }

  let targetUrl = '/';

  if (data && data.url) {
    targetUrl = data.url;
  } else if (data && data.type) {
    switch (data.type) {
      case 'job_alert':
        targetUrl = '/jobs';
        break;
      case 'application_update':
        targetUrl = '/applications';
        break;
      case 'mentoring_session':
        targetUrl = '/mentoring';
        break;
      case 'system_announcement':
        targetUrl = '/notifications';
        break;
      default:
        targetUrl = '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background sync functions
async function syncJobApplications() {
  try {
    console.log('Service Worker: Syncing job applications');

    // Get pending applications from IndexedDB
    const pendingApplications = await getPendingApplications();

    for (const application of pendingApplications) {
      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${application.token}`
          },
          body: JSON.stringify(application.data)
        });

        if (response.ok) {
          await removePendingApplication(application.id);
          console.log('Service Worker: Application synced successfully');
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync application', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Job application sync failed', error);
  }
}

async function syncNotifications() {
  try {
    console.log('Service Worker: Syncing notifications');

    // Fetch latest notifications
    const response = await fetch('/api/notifications/sync');
    if (response.ok) {
      const notifications = await response.json();

      // Store notifications in cache for offline access
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put('/api/notifications/latest', new Response(JSON.stringify(notifications)));
    }
  } catch (error) {
    console.error('Service Worker: Notification sync failed', error);
  }
}

async function syncProfileUpdates() {
  try {
    console.log('Service Worker: Syncing profile updates');

    // Get pending profile updates from IndexedDB
    const pendingUpdates = await getPendingProfileUpdates();

    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${update.token}`
          },
          body: JSON.stringify(update.data)
        });

        if (response.ok) {
          await removePendingProfileUpdate(update.id);
          console.log('Service Worker: Profile update synced successfully');
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync profile update', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Profile update sync failed', error);
  }
}

// IndexedDB helper functions (simplified - would need full implementation)
async function getPendingApplications() {
  // Implementation would use IndexedDB to retrieve pending applications
  return [];
}

async function removePendingApplication(id) {
  // Implementation would remove application from IndexedDB
}

async function getPendingProfileUpdates() {
  // Implementation would use IndexedDB to retrieve pending profile updates
  return [];
}

async function removePendingProfileUpdate(id) {
  // Implementation would remove profile update from IndexedDB
}

console.log('Service Worker: Enhanced PWA features loaded successfully');
