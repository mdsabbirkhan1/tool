// Service Worker for Tools Hub PWA
const CACHE_NAME = 'tools-hub-v1.0.0';
const CACHE_VERSION = '1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/js/app.js',
    '/js/pwa.js',
    '/js/theme.js',
    '/js/search.js',
    '/js/storage.js',
    '/js/analytics.js',
    '/js/tools/development-tools.js',
    '/js/tools/text-tools.js',
    '/js/tools/image-tools.js',
    '/js/tools/productivity-tools.js',
    '/js/tools/utility-tools.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = [
    {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
        handler: 'StaleWhileRevalidate',
        options: {
            cacheName: 'google-fonts-stylesheets',
            expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
        }
    },
    {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
        handler: 'CacheFirst',
        options: {
            cacheName: 'google-fonts-webfonts',
            expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
        }
    },
    {
        urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\//,
        handler: 'StaleWhileRevalidate',
        options: {
            cacheName: 'cdn-resources',
            expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
            }
        }
    }
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_CACHE_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                // Force activation of new service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName.startsWith('tools-hub-')) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ])
        .then(() => {
            console.log('Service Worker activated successfully');
            // Notify clients about cache update
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'CACHE_UPDATED',
                        version: CACHE_VERSION
                    });
                });
            });
        })
    );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests and non-GET requests
    if (url.origin !== location.origin && !request.url.startsWith('https://fonts.') && !request.url.startsWith('https://cdnjs.')) {
        return;
    }
    
    if (request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        handleFetch(request)
    );
});

// Handle fetch requests with caching strategies
async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Check for runtime cache patterns
        for (const pattern of RUNTIME_CACHE_PATTERNS) {
            if (pattern.urlPattern.test(request.url)) {
                return await handleCacheStrategy(request, pattern.handler, pattern.options);
            }
        }
        
        // Handle navigation requests (HTML pages)
        if (request.mode === 'navigate') {
            return await handleNavigationRequest(request);
        }
        
        // Handle static assets
        if (url.origin === location.origin) {
            return await handleStaticAsset(request);
        }
        
        // Fallback to network
        return await fetch(request);
        
    } catch (error) {
        console.error('Fetch error:', error);
        return await handleFetchError(request, error);
    }
}

// Handle navigation requests (app shell)
async function handleNavigationRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fall back to cached version
        const cachedResponse = await caches.match('/index.html');
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback
        return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
                <title>Tools Hub - Offline</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
                    .offline { color: #666; }
                    .retry-btn { 
                        background: #4F46E5; color: white; border: none; 
                        padding: 12px 24px; border-radius: 8px; cursor: pointer; 
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <h1>Tools Hub</h1>
                <div class="offline">
                    <p>You're currently offline. Please check your internet connection.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
                </div>
            </body>
            </html>`,
            {
                headers: { 'Content-Type': 'text/html' },
                status: 200
            }
        );
    }
}

// Handle static assets
async function handleStaticAsset(request) {
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        // Serve from cache and update in background
        fetchAndCache(request);
        return cachedResponse;
    }
    
    // Try network
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return generic fallback for failed requests
        if (request.destination === 'image') {
            return new Response(
                '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#666">Image unavailable</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }
        
        throw error;
    }
}

// Handle different caching strategies
async function handleCacheStrategy(request, strategy, options) {
    const cacheName = options?.cacheName || CACHE_NAME;
    
    switch (strategy) {
        case 'CacheFirst':
            return await cacheFirst(request, cacheName, options);
        case 'NetworkFirst':
            return await networkFirst(request, cacheName, options);
        case 'StaleWhileRevalidate':
            return await staleWhileRevalidate(request, cacheName, options);
        default:
            return await fetch(request);
    }
}

// Cache First strategy
async function cacheFirst(request, cacheName, options) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

// Network First strategy
async function networkFirst(request, cacheName, options) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName, options) {
    const cachedResponse = await caches.match(request);
    
    // Always fetch in background to update cache
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
            const cache = caches.open(cacheName);
            cache.then((c) => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Otherwise wait for network
    return await fetchPromise;
}

// Background fetch and cache
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
    } catch (error) {
        // Ignore background fetch errors
        console.log('Background fetch failed:', error);
    }
}

// Handle fetch errors
async function handleFetchError(request, error) {
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Return appropriate error response based on request type
    if (request.mode === 'navigate') {
        return await handleNavigationRequest(request);
    }
    
    if (request.destination === 'image') {
        return new Response(
            '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#666">Image unavailable</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }
    
    throw error;
}

// Handle messages from clients
self.addEventListener('message', (event) => {
    const { data } = event;
    
    if (data && data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (data && data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
    
    if (data && data.type === 'CLEAN_CACHE') {
        cleanupCache().then(() => {
            event.ports[0].postMessage({ success: true });
        }).catch((error) => {
            event.ports[0].postMessage({ success: false, error: error.message });
        });
    }
});

// Clean up expired cache entries
async function cleanupCache() {
    const cacheNames = await caches.keys();
    
    return Promise.all(
        cacheNames.map(async (cacheName) => {
            if (cacheName.startsWith('tools-hub-') && cacheName !== CACHE_NAME) {
                console.log('Cleaning up cache:', cacheName);
                return caches.delete(cacheName);
            }
        })
    );
}

// Background sync for analytics and user data
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Sync analytics data when back online
    try {
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({ type: 'BACKGROUND_SYNC' });
        });
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-96.png',
            vibrate: [200, 100, 200],
            data: data.data || {},
            actions: [
                {
                    action: 'open',
                    title: 'Open Tools Hub'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('Service Worker loaded successfully');