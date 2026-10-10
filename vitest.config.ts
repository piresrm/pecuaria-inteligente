import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/contracts/vitest.config.ts'],
    pool: 'forks',
    isolate: true,
    globals: false,
    passWithNoTests: false,
    allowOnly: false,
    retry: 0,
    ...(process.env.CI ? { maxWorkers: 2 } : {}),
    coverage: {
      provider: 'v8',
      include: ['packages/contracts/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/generated/**'],
      reporter: ['text', 'json-summary', 'lcov', 'html'],
      reportsDirectory: 'artifacts/coverage/unit',
    },
  },
});
