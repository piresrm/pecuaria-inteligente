import { test, expect } from './fixtures';
test('HTTPS confiável redireciona HTTP e protege a origem pública', async ({ page, request }) => {
  const insecure = await request.get('http://localhost/api/v1/mercado/resumo', { maxRedirects: 0 });
  expect(insecure.status()).toBe(308);
  expect(insecure.headers().location).toBe('https://localhost/api/v1/mercado/resumo');
  expect((await request.get('/internal/ready')).status()).toBe(404);
  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  const unsafe: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('http:')) unsafe.push(request.url());
  });
  await page.reload();
  await expect(page.getByText('Dados demonstrativos', { exact: true })).toBeVisible();
  expect(unsafe).toEqual([]);
  expect(await page.evaluate(() => window.isSecureContext)).toBe(true);
});
test('Caddy preserva caminho, ETag e revalidação; sobrescreve cabeçalho forjado', async ({
  request,
}) => {
  const first = await request.get('/api/v1/mercado/resumo', {
    headers: { 'X-Forwarded-For': 'inválido' },
  });
  expect(first.status()).toBe(200);
  expect(first.headers()['cache-control']).toBe('public, max-age=60, must-revalidate');
  expect(first.headers().etag).toMatch(/^W\/"v1-resumo-/);
  const next = await request.get('/api/v1/mercado/resumo', {
    headers: { 'If-None-Match': first.headers().etag! },
  });
  expect(next.status()).toBe(304);
  expect(await next.body()).toHaveLength(0);
});
