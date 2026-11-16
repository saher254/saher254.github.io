// sw.js - Service Worker للعمل بدون إنترنت
const CACHE_NAME = 'bakaloria-offline-v1';
const OFFLINE_URL = '/offline.html';

// ✅ الملفات الأساسية اللي بتتخزن أول مرة
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/logo.png'
];

// ✅ تثبيت Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// ✅ تفعيل Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ✅ التعامل مع الطلبات
self.addEventListener('fetch', (event) => {
    // لو الطلب بيحاول يفتح صفحة (navigation)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // ✅ لو النت فصل، اعرض offline.html
                return caches.match(OFFLINE_URL);
            })
        );
        return;
    }

    // ✅ لباقي الملفات (صور، CSS، JS): Cache First
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                // خزن الملفات الجديدة في الكاش
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
