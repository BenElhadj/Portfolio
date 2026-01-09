// Préfixe pour le sous-dossier GitHub Pages
const PREFIX = '/Portfolio';
// Script Node.js ES module pour générer la liste des fichiers à mettre en cache dans le service worker
// Usage : node generate-cache-list.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dossiers à scanner (relatifs à dist)
const folders = [
  'cv',
  'experiences',
  'logos/flags',
  'logos/skills',
  'logos/texts',
  'models',
  'qr'
];

const distDir = path.join(__dirname, 'dist');
let filesToCache = [];

folders.forEach(folder => {
  const dirPath = path.join(distDir, folder);
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath)
      .filter(f => fs.statSync(path.join(dirPath, f)).isFile())
      .map(f => `${PREFIX}/${folder}/${f}`);
    filesToCache = filesToCache.concat(files);
  }
});


// Met à jour automatiquement le tableau urlsToCache dans le service worker
const swPath = path.join(__dirname, 'public', 'service-worker.js');
let swContent = fs.readFileSync(swPath, 'utf-8');

// Remplace le contenu du tableau urlsToCache
const start = swContent.indexOf('const urlsToCache = [');
if (start === -1) {
  console.error('urlsToCache introuvable dans service-worker.js');
  process.exit(1);
}
const before = swContent.slice(0, start);
const afterArr = swContent.slice(start).split('];');
if (afterArr.length < 2) {
  console.error('Fin du tableau urlsToCache non trouvée');
  process.exit(1);
}
const after = afterArr[1];

// Ajoute dynamiquement tous les JS/CSS générés dans dist/assets et dist/assets/css
function getAssetFiles(subdir = '') {
  const dir = path.join(distDir, 'assets', subdir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => fs.statSync(path.join(dir, f)).isFile() && !f.endsWith('.gz'))
    .map(f => `${PREFIX}/assets${subdir ? '/' + subdir : ''}/${f}`);
}

const staticFiles = [
  `${PREFIX}/`,
  `${PREFIX}/index.html`,
  `${PREFIX}/favicon.ico`,
  `${PREFIX}/favicon.webp`,
  `${PREFIX}/degrees/42.webp`,
  `${PREFIX}/degrees/GRETA.webp`,
  `${PREFIX}/degrees/MEFP.webp`,
  ...getAssetFiles(),
  ...getAssetFiles('css'),
];

const newUrls = staticFiles.concat(filesToCache);
const newUrlsString = 'const urlsToCache = [\n' + newUrls.map(f => `  '${f}',`).join('\n') + '\n];';

const newSwContent = before + newUrlsString + afterArr[1];
fs.writeFileSync(swPath, newSwContent, 'utf-8');
console.log('service-worker.js mis à jour avec', newUrls.length, 'fichiers.');
