// Ce script génère un fichier cache-manifest.json listant tous les fichiers du dossier public (et sous-dossiers)
// à utiliser pour le service worker.

const fs = require('fs');
const path = require('path');

// On scanne désormais le dossier dist/ après le build
const distDir = path.join(__dirname, 'dist');
const output = path.join(distDir, 'cache-manifest.json');


// Extensions autorisées (fichiers statiques web)
const allowedExtensions = [
  '.html', '.js', '.css', '.json', '.ico', '.webp', '.png', '.jpg', '.jpeg', '.svg', '.glb', '.ttf', '.pdf', '.woff', '.woff2', '.mp3', '.mp4', '.webm', '.txt', '.xml', '.wasm'
];
// Fichiers/dossiers à ignorer (racine ou sous-dossiers)
const ignoreFiles = [
  'cache-manifest.json', 'service-worker.js', '.DS_Store', 'Thumbs.db', 'convert_to_webp.py', 'scenario.docx'
];
const ignoreDirs = [
  'SourceAssets', 'Maps', '__MACOSX'
];

function walk(dir, baseUrl = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        results = results.concat(walk(filePath, baseUrl + '/' + file));
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (
        !ignoreFiles.includes(file) &&
        allowedExtensions.includes(ext)
      ) {
        results.push(baseUrl + '/' + file);
      }
    }
  });
  return results;
}

const files = walk(distDir, '').map(f => f.replace(/\\/g, '/'));

fs.writeFileSync(output, JSON.stringify(files, null, 2));
console.log('cache-manifest.json généré dans dist/ avec', files.length, 'fichiers.');
