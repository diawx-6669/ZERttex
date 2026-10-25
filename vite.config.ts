import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file build: dist/index.html contains all JS and CSS inline,
// so the prototype opens by double-click or from any static host.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { target: 'es2019', cssCodeSplit: false, assetsInlineLimit: 100_000_000, rollupOptions: { input: 'app.html' } },
});
