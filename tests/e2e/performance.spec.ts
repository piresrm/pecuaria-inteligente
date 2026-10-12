import { test, expect } from '@playwright/test';

const baseUrl = process.env.PERFORMANCE_BASE_URL;

test('registra cinco navegações sem cache quando o executor de desempenho está disponível', async ({
  browser,
}) => {
  test.skip(!baseUrl, 'PERFORMANCE_BASE_URL não configurada; medição permanece não realizada');
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const runs: Array<{ navigation: number; transferredBytes: number }> = [];
  try {
    for (let navigation = 1; navigation <= 5; navigation += 1) {
      const page = await context.newPage();
      await page.route('**/*', async (route) => route.continue());
      await page.goto(`${baseUrl}?performance_run=${navigation}`, { waitUntil: 'networkidle' });
      const transferredBytes = await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .reduce(
            (total, entry) => total + ((entry as PerformanceResourceTiming).transferSize || 0),
            0,
          ),
      );
      runs.push({ navigation, transferredBytes });
      await page.close();
    }
    expect(runs).toHaveLength(5);
    await test.info().attach('performance-runs.json', {
      body: JSON.stringify(runs, null, 2),
      contentType: 'application/json',
    });
  } finally {
    await context.close();
  }
});
