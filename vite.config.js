import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  esbuild: {
    keepNames: true,
  },
  server: {
    port: 5173,
  },
  publicDir: 'assets',
  base: '/bomberman/'
});
