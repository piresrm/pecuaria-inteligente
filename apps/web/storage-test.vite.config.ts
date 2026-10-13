import { defineConfig } from 'vite';
// Dedicated test artifact. No test hooks enter the application's production build.
export default defineConfig({
  root: import.meta.dirname,
  build: {
    outDir: '../../artifacts/storage-harness',
    emptyOutDir: true,
    rollupOptions: { input: new URL('./tests/storage-harness.html', import.meta.url).pathname },
  },
});
