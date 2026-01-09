const CACHE_NAME = 'portfolio-cache-v3';

// Fonction pour charger dynamiquement la liste des fichiers à mettre en cache
async function getUrlsToCache() {
  try {
    // On construit l'URL absolue de cache-manifest.json selon l'emplacement du service worker
    const manifestUrl = new URL('cache-manifest.json', self.location);
    const response = await fetch(manifestUrl.href);
    if (!response.ok) throw new Error('cache-manifest.json introuvable');
    const files = await response.json();
    // On ajoute la racine et index.html si besoin
    return ['/', '/index.html', ...files];
  } catch (e) {
    console.error('Impossible de charger cache-manifest.json', e);
    return ['/', '/index.html'];
  }
}


// Désactive le service worker en dev (localhost)
self.addEventListener('install', event => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.warn('Service Worker désactivé en développement.');
    // On stoppe l'installation, rien n'est fait
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    (async () => {
      const urlsToCache = await getUrlsToCache();
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        urlsToCache.map(async url => {
          try {
            await cache.add(url);
          } catch (e) {
            console.warn('Service Worker: Ressource non cachée', url, e);
          }
        })
      );
    })()
  );
});

self.addEventListener('fetch', event => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    // En dev, ne rien intercepter
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
