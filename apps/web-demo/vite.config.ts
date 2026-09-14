import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@courses': path.resolve(__dirname, '../../courses'),
      '@villarceaux/viewer': path.resolve(__dirname, '../../packages/viewer/src/index.ts'),
      '@villarceaux/scene-contract': path.resolve(__dirname, '../../packages/scene-contract/src/index.ts'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  build: {
    outDir: '../../exports/villarceaux/hole-01/web/dist',
    emptyOutDir: true,
  },
  base: './',
});
