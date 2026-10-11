import { expect, test } from 'vitest';
import { ControlMetrics } from './metrics.js';
import { IpQuota } from './ip-quota.js';
import { DatabaseAdmission } from './database-admission.js';
import { EntryControl } from './entry-control.js';
test('métricas agregam entrada e falhas sem identificador pessoal nem permitir tráfego', () => {
  const metrics = new ControlMetrics();
  const entry = new EntryControl(new IpQuota({ now: () => 0 }), [], metrics);
  for (let n = 0; n < 30; n++)
    entry.verificar({ remoteAddress: '192.0.2.1', forwardedFor: undefined });
  expect(() => entry.verificar({ remoteAddress: '192.0.2.1', forwardedFor: undefined })).toThrow(
    'LIMITE_REQUISICOES',
  );
  expect(() => entry.verificar({ remoteAddress: '', forwardedFor: undefined })).toThrow(
    'CONTROLE_INDISPONIVEL',
  );
  expect(metrics.snapshot().entrada).toEqual({ admitidas: 30, recusadas: 1, indisponiveis: 1 });
  expect(JSON.stringify(metrics.snapshot())).not.toContain('192.0.2.1');
});

test('admissão mede latência por operação e libera gauge em erro sem vazar labels', async () => {
  let now = 0;
  const metrics = new ControlMetrics();
  const admission = new DatabaseAdmission(metrics, () => now);
  expect(
    await admission.run(() => {
      now = 7;
      return Promise.resolve(42);
    }, 'resumo'),
  ).toBe(42);
  await expect(
    admission.run(() => {
      now = 12;
      return Promise.reject(new Error('query failed'));
    }, 'historico'),
  ).rejects.toThrow('query failed');
  expect(metrics.snapshot().banco).toEqual({ admitidas: 2, recusadas: 0, ativas: 0, pico: 1 });
  expect(metrics.snapshot().operacoes.resumo).toEqual({
    concluidas: 1,
    falhas: 0,
    totalMs: 7,
    maxMs: 7,
  });
  expect(metrics.snapshot().operacoes.historico).toEqual({
    concluidas: 1,
    falhas: 1,
    totalMs: 5,
    maxMs: 5,
  });
  const snapshot = metrics.snapshot();
  snapshot.banco.admitidas = 100;
  expect(metrics.snapshot().banco.admitidas).toBe(2);
});
