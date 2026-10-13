import { defineProject } from 'vitest/config';
export default defineProject({
  test: {
    name: 'contratos',
    root: import.meta.dirname,
    include: ['src/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    isolate: true,
    globals: false,
    allowOnly: false,
    retry: 0,
    testTimeout: 5000,
    hookTimeout: 10000,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    ...(process.env.CI ? { maxWorkers: 2 } : {}),
  },
});
