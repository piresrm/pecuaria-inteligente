import { expect, test } from 'vitest';
import { IpQuota } from './ip-quota.js';
test('admite 30 imediatas, recusa sem debitar e repõe duas por segundo', () => {
  let now = 0;
  const quota = new IpQuota({ now: () => now });
  for (let n = 0; n < 30; n++) expect(quota.consume('192.0.2.1').permitido).toBe(true);
  expect(quota.consume('192.0.2.1')).toEqual({ permitido: false, retryAfter: 1 });
  for (let n = 0; n < 100; n++) expect(quota.consume('192.0.2.1').permitido).toBe(false);
  now = 499;
  expect(quota.consume('192.0.2.1').permitido).toBe(false);
  now = 500;
  expect(quota.consume('192.0.2.1').permitido).toBe(true);
  expect(quota.consume('192.0.2.1').permitido).toBe(false);
  now = 1500;
  expect(quota.consume('192.0.2.1').permitido).toBe(true);
  expect(quota.consume('192.0.2.1').permitido).toBe(true);
  expect(quota.consume('192.0.2.1').permitido).toBe(false);
  expect(quota.consume('192.0.2.2').permitido).toBe(true);
});
test('não expulsa balde ativo quando mapa satura; expira somente inativo reposto', () => {
  let now = 0;
  const quota = new IpQuota({ now: () => now, maxBuckets: 1 });
  expect(quota.consume('192.0.2.1').permitido).toBe(true);
  expect(() => quota.consume('192.0.2.2')).toThrow('CONTROLE_INDISPONIVEL');
  now = 59000;
  expect(() => quota.consume('192.0.2.2')).toThrow('CONTROLE_INDISPONIVEL');
  now = 60000;
  expect(quota.consume('192.0.2.2').permitido).toBe(true);
  expect(() => quota.consume('192.0.2.1')).toThrow('CONTROLE_INDISPONIVEL');
});
test('relógio inválido ou regressivo mantém controle fechado', () => {
  let now = 1;
  const quota = new IpQuota({ now: () => now });
  quota.consume('a');
  now = 0;
  expect(() => quota.consume('a')).toThrow('CONTROLE_INDISPONIVEL');
  now = NaN;
  expect(() => quota.consume('a')).toThrow('CONTROLE_INDISPONIVEL');
});

test('recusas fracionárias não alteram a reposição nem atrasam permissão na fronteira', () => {
  let now = 0;
  const quota = new IpQuota({ now: () => now });
  for (let n = 0; n < 30; n++) quota.consume('a');
  for (now = 50; now < 500; now += 50) expect(quota.consume('a').permitido).toBe(false);
  expect(quota.consume('a').permitido).toBe(true);
});
test('balde inativo ainda não reposto não pode ceder vaga para identidade nova', () => {
  let now = 0;
  const quota = new IpQuota({ now: () => now, maxBuckets: 1, idleMs: 1000 });
  for (let n = 0; n < 30; n++) quota.consume('a');
  now = 1000;
  expect(() => quota.consume('b')).toThrow('CONTROLE_INDISPONIVEL');
  now = 15000;
  expect(quota.consume('b').permitido).toBe(true);
});

test('limite reduzido calcula Retry-After inteiro arredondado para cima', () => {
  let now = 0;
  const quota = new IpQuota({ now: () => now, capacity: 1, refillPerSecond: 0.5 });
  expect(quota.consume('a').permitido).toBe(true);
  expect(quota.consume('a')).toEqual({ permitido: false, retryAfter: 2 });
  now = 600;
  expect(quota.consume('a')).toEqual({ permitido: false, retryAfter: 2 });
  now = 1999;
  expect(quota.consume('a')).toEqual({ permitido: false, retryAfter: 1 });
  now = 2000;
  expect(quota.consume('a').permitido).toBe(true);
});

test('recusa atualiza inatividade sem alterar a base de reposição', () => {
  let now = 0;
  const quota = new IpQuota({ now: () => now, maxBuckets: 1 });
  for (let n = 0; n < 30; n++) quota.consume('a');
  now = 450;
  expect(quota.consume('a').permitido).toBe(false);
  now = 60000;
  expect(() => quota.consume('b')).toThrow('CONTROLE_INDISPONIVEL');
  now = 61000;
  expect(quota.consume('b').permitido).toBe(true);
});
