import { expect, test } from 'vitest';
import { ResourceCache } from './resource-cache.js';
const key = { operacao: 'resumo', versao: 'v1' } as const;
test('compartilha uma promessa em andamento e seu resultado entre consultas equivalentes', async () => {
  const cache = new ResourceCache<string>();
  let complete!: (value: string) => void;
  let loads = 0;
  const load = () => {
    loads++;
    return new Promise<string>((resolve) => {
      complete = resolve;
    });
  };
  const first = cache.get(key, load);
  const second = cache.get({ ...key }, load);
  expect(loads).toBe(1);
  complete('validated-body');
  expect(await first).toBe('validated-body');
  expect(await second).toBe('validated-body');
  expect(await cache.get(key, load)).toBe('validated-body');
  expect(loads).toBe(1);
});
test('expira no máximo em 60 segundos e isola versão, operação e perfil', async () => {
  let now = 0;
  const cache = new ResourceCache<number>({ now: () => now });
  let loads = 0;
  const load = () => Promise.resolve(++loads);
  expect(await cache.get(key, load)).toBe(1);
  now = 59999;
  expect(await cache.get(key, load)).toBe(1);
  expect(await cache.get({ ...key, versao: 'v2' }, load)).toBe(2);
  expect(await cache.get({ operacao: 'historico', versao: 'v1', perfilId: 'p1' }, load)).toBe(3);
  expect(await cache.get({ operacao: 'historico', versao: 'v1', perfilId: 'p2' }, load)).toBe(4);
  now = 60000;
  expect(await cache.get(key, load)).toBe(5);
  expect(() => new ResourceCache({ ttlMs: 60001 })).toThrow();
  expect(() => new ResourceCache({ ttlMs: 0 })).toThrow();
});
test('remove promessa rejeitada, compartilha a falha e permite nova carga', async () => {
  const cache = new ResourceCache<string>();
  let reject!: (reason: Error) => void;
  const first = cache.get(
    key,
    () =>
      new Promise<string>((_, fail) => {
        reject = fail;
      }),
  );
  const second = cache.get(key, () => Promise.resolve('should-not-load'));
  reject(new Error('failed-validation'));
  const results = await Promise.allSettled([first, second]);
  expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
  expect(await cache.get(key, () => Promise.resolve('valid-retry'))).toBe('valid-retry');
});
test('mudança do ponteiro invalida resumo anterior sem impedir resposta já em andamento', async () => {
  const cache = new ResourceCache<string>();
  let finish!: (value: string) => void;
  const old = cache.get(
    key,
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  cache.selectSummaryVersion('v2');
  finish('old-complete');
  expect(await old).toBe('old-complete');
  expect(await cache.get(key, () => Promise.resolve('reloaded'))).toBe('reloaded');
});
