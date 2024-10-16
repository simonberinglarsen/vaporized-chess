// service-worker.js

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('app-cache').then((cache) => {
            return cache.addAll([
                '/vaporized-chess/',
                '/vaporized-chess/index.html',
                '/vaporized-chess/engine.mjs',
                '/vaporized-chess/game.mjs',
                '/vaporized-chess/service-worker.js',
                '/vaporized-chess/scenes/bishop.mjs',
                '/vaporized-chess/scenes/score.mjs',
                '/vaporized-chess/icons/icon-192x192.png',
                '/vaporized-chess/icons/icon-512x512.png',
                '/vaporized-chess/fonts/PressStart2P-Regular.ttf'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
