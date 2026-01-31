// Utilitaire pour gérer les chemins d'assets en dev et production
export const getAssetPath = (path) => {
  // Always resolve assets relative to Vite base URL so paths work
  // both in dev and when deployed under a subpath (GitHub Pages).
  const base = import.meta.env.BASE_URL || './';
  // strip leading slashes from provided path
  const clean = String(path || '').replace(/^\/+/, '');
  // ensure base ends with a single slash
  const prefix = String(base).replace(/\/*$/, '/') ;
  return `${prefix}${clean}`;
};

// Return an asset path preferring a given extension (e.g. 'webp').
// Behavior:
// - If `path` is an absolute URL (http(s)://) it is returned unchanged.
// - If `path` already has an extension, it will be replaced by the preferred one.
// - If `path` has no extension, the preferred one will be appended.
// The returned path is passed through `getAssetPath` so it is normalized with BASE_URL.
// NOTE: getPreferredAssetPath removed — project uses explicit .webp assets in locales and components.