import { defineConfig } from 'vitest/config';
import { historyChartUrl } from './history-chart-url.config.ts';
export default defineConfig({
  plugins: [historyChartUrl()],
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
