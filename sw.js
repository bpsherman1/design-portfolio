/* Brad Sherman Design — service worker
 *
 * Strategy:
 *   - Precache the app shell (HTML pages, CSS, JS, icons) on install so the
 *     site works offline immediately.
 *   - Runtime cache images on first view (cache-first with network fallback).
 *   - Network-first for HTML so visitors see updates on the next navigation.
 *
 * To ship an update: bump CACHE_VERSION. The old cache is purged on activate.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/contact.html',
    '/branding.html',
    '/rebranding.html',
    '/editorial.html',
    '/poster-print.html',
    '/campaigns.html',
    '/websites.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icons/icon-180.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then(cache => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys
                .filter(key => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
                .map(key => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    const isHTML = req.mode === 'navigate' ||
                   (req.headers.get('accept') || '').includes('text/html');

    if (isHTML) {
        // Network-first: try fresh, fall back to cached shell offline.
        event.respondWith(
            fetch(req)
                .then(res => {
                    const copy = res.clone();
                    caches.open(SHELL_CACHE).then(c => c.put(req, copy));
                    return res;
                })
                .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
        );
        return;
    }

    // Static assets: cache-first, then network, then store in runtime cache.
    event.respondWith(
        caches.match(req).then(cached => {
            if (cached) return cached;
            return fetch(req).then(res => {
                if (!res || res.status !== 200 || res.type === 'opaque') return res;
                const copy = res.clone();
                caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
                return res;
            });
        })
    );
});
