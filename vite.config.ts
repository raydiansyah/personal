/**
 * Module: raydiansyah.com Vite/TanStack configuration
 * Purpose: Register the single React SPA entry point for dev/build
 * Used by: npm run dev, npm run build
 * Dependencies: Vite, React plugin
 * Public functions: Vite configuration export
 * Side effects: Build-time SPA asset bundling
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
