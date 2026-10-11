import { defineProject } from 'vitest/config';
export default defineProject({
  resolve: {
    alias: {
      '@pecuaria/contracts/server': `${import.meta.dirname}/../../packages/contracts/src/server.ts`,
    },
  },
  test: {
    name: 'banco',
    root: import.meta.dirname,
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    isolate: true,
    globals: false,
    allowOnly: false,
    retry: 0,
    maxWorkers: 1,
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
