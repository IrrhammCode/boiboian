import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so GitHub Pages / any static host works under a subpath.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    host: true,
  },
});
