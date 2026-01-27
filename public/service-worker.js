const CACHE_NAME = 'portfolio-cache-v3';

// Fonction pour charger dynamiquement la liste des fichiers à mettre en cache
async function getUrlsToCache() {
  try {
    // Base URL correspondant au répertoire contenant le service-worker (ex: https://.../Portfolio/)
    const baseUrl = new URL('.', self.location).href;
    // On construit l'URL du cache-manifest.json à partir de ce baseUrl
    const manifestUrl = new URL('cache-manifest.json', baseUrl);
    const response = await fetch(manifestUrl.href);
    if (!response.ok) throw new Error('cache-manifest.json introuvable');
    const files = await response.json();
    // Normaliser les chemins du manifeste en URL absolues en respectant le baseUrl
    const normalized = (Array.isArray(files) ? files : []).map((f) => {
      if (typeof f !== 'string') return f;
      // laisser les data: ou URLs externes telles quelles
      if (/^data:|^https?:\/\//i.test(f)) return f;
      // si le manifeste contient des chemins absolus commençant par '/...'
      // on les résout en les préfixant par le baseUrl (sous-chemin du site)
      if (f.startsWith('/')) {
        return new URL(f.replace(/^\//, ''), baseUrl).href;
      }
      // sinon, résoudre relatif au baseUrl
      return new URL(f, baseUrl).href;
    });

    // On ajoute la racine du baseUrl et index.html
    const rootUrl = baseUrl;
    const indexUrl = new URL('index.html', baseUrl).href;
    return [rootUrl, indexUrl, ...normalized];
  } catch (e) {
    console.error('Impossible de charger cache-manifest.json', e);
    // fallback: utiliser la racine du service-worker comme scope
    const baseUrl = new URL('.', self.location).href;
    return [baseUrl, new URL('index.html', baseUrl).href];
  }
}


// Désactive le service worker en dev (localhost)
self.addEventListener('install', event => {
  // Activer le Service Worker uniquement sur des origines sécurisées (https)
  // ou en développement local (localhost / 127.0.0.1).
  const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  const isSecure = self.location.protocol === 'https:';
  if (!isSecure && !isLocalhost) {
    console.warn('Service Worker désactivé : actif seulement sur une origine sécurisée (https) ou localhost.');
    // On stoppe l'installation pour éviter des fetchs invalides (ex: file://)
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
