import { defineProject } from 'vitest/config';
export default defineProject({
  resolve: {
    alias: {
      '@pecuaria/contracts/server': `${import.meta.dirname}/../../packages/contracts/src/server.ts`,
    },
  },
  test: {
    name: 'api',
    root: import.meta.dirname,
    include: ['src/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    isolate: true,
    globals: false,
    allowOnly: false,
    retry: 0,
  },
});
