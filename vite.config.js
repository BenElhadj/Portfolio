import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev.config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    // Ajoutez cette section pour mieux gérer les assets
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.')[1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
      }
    }
  },
  // Ajoutez cette section pour résoudre les alias
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})