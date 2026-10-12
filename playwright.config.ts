import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60000,
  expect: { timeout: 5000 },
  outputDir: 'artifacts/e2e/results',
  reporter: [['list'], ['json', { outputFile: 'artifacts/e2e/report.json' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://localhost',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
