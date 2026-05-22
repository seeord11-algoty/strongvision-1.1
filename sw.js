/**
 * StrongVision - Service Worker
 * ==============================
 * Permite uso offline cacheando recursos estáticos y datasets.
 * Cubre RFU-11 (TC-037, TC-038).
 */

const CACHE_NAME = 'strongvision-v1.0.0';
const RECURSOS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/auth.css',
    '/css/dashboard.css',
    '/js/storage.js',
    '/js/auth.js',
    '/js/main.js',
    '/js/ia-engine.js',
    '/js/dashboard.js',
    '/js/perfil.js',
    '/js/rutina.js',
    '/js/entrenamiento.js',
    '/js/progreso.js',
    '/js/biblioteca.js',
    '/js/ajustes.js',
    '/js/admin.js',
    '/pages/dashboard.html',
    '/pages/perfil.html',
    '/pages/rutina.html',
    '/pages/entrenamiento.html',
    '/pages/progreso.html',
    '/pages/biblioteca.html',
    '/pages/ajustes.html',
    '/pages/admin.html',
    '/data/ejercicios.json',
    '/data/heuristicas.json',
    '/data/filtros.json'
];

// Instalación: cachear recursos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando recursos esenciales');
                // addAll falla si alguno falla; preferimos add individual con catch
                return Promise.all(
                    RECURSOS.map(r => cache.add(r).catch(err => {
                        console.warn(`[SW] No se pudo cachear ${r}:`, err.message);
                    }))
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names => {
            return Promise.all(
                names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: estrategia network-first con fallback a cache
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cachear respuestas exitosas
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Sin red: buscar en cache
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    // Fallback básico
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('Sin conexión y recurso no cacheado', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                    });
                });
            })
    );
});
