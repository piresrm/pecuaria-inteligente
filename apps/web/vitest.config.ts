import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    name: 'componentes',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup.ts'],
    globals: false,
    passWithNoTests: false,
    retry: 0,
  },
});
