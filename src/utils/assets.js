// Utilitaire pour gérer les chemins d'assets en dev et production
export const getAssetPath = (path) => {
  // En développement, utilise le chemin absolu
  // En production, utilise le chemin relatif
  if (import.meta.env.DEV) {
    return path;
  } else {
    return `.${path}`;
  }
};