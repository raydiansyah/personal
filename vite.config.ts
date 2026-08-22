/**
 * Module: raydiansyah.com Vite/TanStack configuration
 * Purpose: Register React and multi-page HTML entry points for dev/build
 * Used by: npm run dev, npm run build
 * Dependencies: Vite, React plugin
 * Public functions: Vite configuration export
 * Side effects: Build-time route generation and asset bundling
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app.html'),
      },
    },
  },
});
