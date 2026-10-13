import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/contracts/vitest.config.ts',
      'packages/domain/vitest.config.ts',
      'apps/api/vitest.integration.config.ts',
      'apps/api/vitest.config.ts',
      'apps/web/vitest.config.ts',
    ],
    pool: 'forks',
    isolate: true,
    globals: false,
    passWithNoTests: false,
    allowOnly: false,
    retry: 0,
    ...(process.env.CI ? { maxWorkers: 2 } : {}),
    coverage: {
      provider: 'v8',
      include: [
        'packages/contracts/src/**/*.ts',
        'packages/domain/src/**/*.ts',
        'apps/api/src/**/*.ts',
        'apps/web/src/**/*.{ts,tsx}',
      ],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/generated/**', '**/fixtures.ts'],
      reporter: ['text', 'json-summary', 'lcov', 'html'],
      reportsDirectory: 'artifacts/coverage/unit',
    },
  },
});
