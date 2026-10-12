import { test, expect } from './fixtures';
test('nova aba recupera consulta durante indisponibilidade', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Consulta disponível', { timeout: 20000 });
  await page.waitForFunction(async () => {
    const request = indexedDB.open('pecuaria-inteligente');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB indisponível'));
    });
    try {
      return await new Promise<boolean>((resolve) => {
        const r = db.transaction('metadados').objectStore('metadados').get('consultaSalva');
        r.onsuccess = () => resolve(Boolean(r.result));
      });
    } finally {
      db.close();
    }
  });
  const other = await context.newPage();
  await other.route('**/api/**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"erro":"SERVICO_INDISPONIVEL"}',
    }),
  );
  await other.goto('/');
  await expect(other.getByText(/R\$/).first()).toBeVisible();
  await expect(other.getByText('Dados demonstrativos', { exact: true })).toBeVisible();
  await other.close();
});
