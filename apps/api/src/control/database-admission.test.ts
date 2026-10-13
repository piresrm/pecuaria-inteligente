import { expect, test } from 'vitest';
import { ControlMetrics } from './metrics.js';
import { DatabaseAdmission } from './database-admission.js';
test('recusa 21ª sem fila; cancelamento consumidor não libera promessa real pendente', async () => {
  const admission = new DatabaseAdmission();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const operations = Array.from({ length: 20 }, () => admission.run(() => pending));
  const consumerCancelled = Promise.race([operations[0], Promise.resolve('cancelled')]);
  expect(await consumerCancelled).toBe('cancelled');
  try {
    await expect(admission.run(() => Promise.resolve('overflow'))).rejects.toThrow(
      'SERVICO_OCUPADO',
    );
  } finally {
    release();
    await Promise.all(operations);
  }
  expect(await admission.run(() => Promise.resolve('available'))).toBe('available');
});
test('libera vaga após rejeição e erro síncrono', async () => {
  const admission = new DatabaseAdmission(new ControlMetrics(), () => 0, 1);
  await expect(admission.run(() => Promise.reject(new Error('query failed')))).rejects.toThrow(
    'query failed',
  );
  await expect(
    admission.run(() => {
      throw new Error('sync failed');
    }),
  ).rejects.toThrow('sync failed');
  expect(await admission.run(() => Promise.resolve(42))).toBe(42);
});
