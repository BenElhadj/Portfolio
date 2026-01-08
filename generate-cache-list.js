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
      .map(f => `/${folder}/${f}`);
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

const staticFiles = [
  '/',
  '/index.html',
  '/assets/index-Djt-6e3O.js',
  '/assets/vue-vendor-4Q8CldyY.js',
  '/assets/gsap-vendor-DDlvirwQ.js',
  '/assets/three-vendor-D_1aLpCO.js',
  '/assets/css/index-jazTp3M_.css',
  '/favicon.ico',
  '/favicon.webp',
  '/degrees/42.webp',
  '/degrees/GRETA.webp',
  '/degrees/MEFP.webp',
];

const newUrls = staticFiles.concat(filesToCache);
const newUrlsString = 'const urlsToCache = [\n' + newUrls.map(f => `  '${f}',`).join('\n') + '\n];';

const newSwContent = before + newUrlsString + afterArr[1];
fs.writeFileSync(swPath, newSwContent, 'utf-8');
console.log('service-worker.js mis à jour avec', newUrls.length, 'fichiers.');
