import { defineConfig } from 'vite';

// Source lives in web/, the built site is written to docs/ (served by GitHub Pages).
export default defineConfig({
  root: 'web',
  base: './',
  build: { outDir: '../docs', emptyOutDir: true },
});
