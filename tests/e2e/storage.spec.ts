import { expect, test } from '@playwright/test';
import type {} from '../../apps/web/tests/storage-browser';
// Serve artifacts/storage-harness on an isolated HTTPS origin with a trusted CA (T10).
// The fixture bundles real storage modules; only this test artifact exposes fault injection.
test.beforeEach(async ({ page }) => {
  await page.goto('/tests/storage-harness.html');
  await page.waitForFunction(() => Boolean(window.storageHarness));
  await page.evaluate(() => window.storageHarness.reset());
});
test.afterEach(async ({ page }) => {
  await page.evaluate(() => window.storageHarness.release());
});
test('confirma dependências, revisão e recuperação coerente', async ({ page }) => {
  expect(await page.evaluate(() => window.storageHarness.save('original', null))).toBe('salva');
  const s = await page.evaluate(() => window.storageHarness.read());
  expect(s?.consulta.revisao).toBe(1);
  expect(s?.resumo.versaoDados).toBe('original');
  expect(s?.historicos[0]?.versaoDados).toBe('original');
});
for (const write of [1, 2, 3])
  for (const kind of ['quota', 'abort'] as const)
    test(`${kind} na escrita ${write} preserva confirmação anterior`, async ({ page }) => {
      await page.evaluate(() => window.storageHarness.save('original', null));
      await page.evaluate(({ write, kind }) => window.storageHarness.fault(write, kind), {
        write,
        kind,
      });
      expect(await page.evaluate(() => window.storageHarness.save('nova', 1))).toBe('memoria');
      await page.evaluate(() => window.storageHarness.release());
      expect((await page.evaluate(() => window.storageHarness.read()))?.consulta.versaoDados).toBe(
        'original',
      );
    });
test('fechamento interrompe confirmação sem anunciar salvamento', async ({ page }) => {
  await page.evaluate(() => window.storageHarness.save('original', null));
  await page.evaluate(() => window.storageHarness.close());
  expect(await page.evaluate(() => window.storageHarness.save('nova', 1))).toBe('memoria');
  await page.reload();
  await page.waitForFunction(() => Boolean(window.storageHarness));
  expect((await page.evaluate(() => window.storageHarness.read()))?.consulta.versaoDados).toBe(
    'original',
  );
});
test('duas abas usam CAS e não repetem fotografia antiga em conflito', async ({
  page,
  context,
}) => {
  await page.evaluate(() => window.storageHarness.save('original', null));
  const other = await context.newPage();
  await other.goto('/tests/storage-harness.html');
  await other.waitForFunction(() => Boolean(window.storageHarness));
  const firstToken = await page.evaluate(() => window.storageHarness.capture());
  const otherToken = await other.evaluate(() => window.storageHarness.capture());
  expect(await other.evaluate((r) => window.storageHarness.save('outra', r), otherToken)).toBe(
    'salva',
  );
  expect(await page.evaluate((r) => window.storageHarness.save('antiga', r), firstToken)).toBe(
    'conflito',
  );
  expect(await page.evaluate((r) => window.storageHarness.save('antiga', r), firstToken)).toBe(
    'conflito',
  );
  await page.evaluate(() => window.storageHarness.cleanup(1));
  expect((await page.evaluate(() => window.storageHarness.read()))?.consulta.versaoDados).toBe(
    'outra',
  );
  await other.close();
});
test('leitura concorrente obtém ponteiro e dependências de uma mesma confirmação', async ({
  page,
}) => {
  await page.evaluate(() => window.storageHarness.save('original', null));
  const snapshots = await page.evaluate(async () => {
    const reads = Array.from({ length: 12 }, () => window.storageHarness.read());
    await window.storageHarness.save('nova', 1);
    return Promise.all(reads);
  });
  for (const s of snapshots) {
    expect(s).not.toBeNull();
    expect(s?.resumo.versaoDados).toBe(s?.consulta.versaoDados);
    expect(s?.historicos[0]?.versaoDados).toBe(s?.consulta.versaoDados);
  }
});
test('orçamento insuficiente mantém consulta salva e candidato em memória', async ({ page }) => {
  await page.evaluate(() => window.storageHarness.save('original', null));
  await page.evaluate(() => window.storageHarness.budget(1));
  expect(await page.evaluate(() => window.storageHarness.save('nova', 1))).toBe('memoria');
  expect((await page.evaluate(() => window.storageHarness.read()))?.consulta.versaoDados).toBe(
    'original',
  );
});
for (const kind of ['missing', 'hash'] as const)
  test(`recuperação rejeita ${kind} preservando referência`, async ({ page }) => {
    await page.evaluate(() => window.storageHarness.save('original', null));
    await page.evaluate((k) => window.storageHarness.corrupt(k), kind);
    expect(await page.evaluate(() => window.storageHarness.read())).toBeNull();
    expect(await page.evaluate(() => window.storageHarness.rawVersion())).toBe('original');
  });
for (const kind of ['summary', 'future'] as const)
  test(`recuperação de ${kind} não infere ordem pelo relógio`, async ({ page }) => {
    await page.evaluate(() => window.storageHarness.save('original', null));
    await page.evaluate((k) => window.storageHarness.corrupt(k), kind);
    expect((await page.evaluate(() => window.storageHarness.read()))?.consulta.versaoDados).toBe(
      'original',
    );
  });
test('migração bloqueada é observada e abertura de versão desconhecida conserva dados', async ({
  page,
}) => {
  await page.evaluate(() => window.storageHarness.save('original', null));
  expect(await page.evaluate(() => window.storageHarness.blockedMigration())).toBe(true);
  await expect(page.evaluate(() => window.storageHarness.read())).rejects.toThrow();
});

test('duas confirmações simultâneas de abas têm somente uma vencedora', async ({
  page,
  context,
}) => {
  await page.evaluate(() => window.storageHarness.save('original', null));
  const other = await context.newPage();
  await other.goto('/tests/storage-harness.html');
  await other.waitForFunction(() => Boolean(window.storageHarness));
  const results = await Promise.all([
    page.evaluate(() => window.storageHarness.save('uma', 1)),
    other.evaluate(() => window.storageHarness.save('outra', 1)),
  ]);
  expect(results.sort()).toEqual(['conflito', 'salva']);
  expect((await page.evaluate(() => window.storageHarness.read()))?.consulta.revisao).toBe(2);
  await other.close();
});
