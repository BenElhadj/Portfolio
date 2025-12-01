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