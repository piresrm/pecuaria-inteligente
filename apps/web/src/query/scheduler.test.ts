import { it, expect, vi } from 'vitest';
import { RequestScheduler, VerificationScheduler } from './scheduler';
it('compartilha equivalentes e reserva no máximo duas vagas; prioridade cancela fundo', async () => {
  const queue = new RequestScheduler();
  let active = 0;
  let max = 0;
  const finishes: (() => void)[] = [];
  const work = (signal: AbortSignal) =>
    new Promise<number>((resolve, reject) => {
      active++;
      max = Math.max(max, active);
      finishes.push(() => {
        active--;
        resolve(1);
      });
      signal.addEventListener(
        'abort',
        () => {
          active--;
          reject(new Error('cancelado'));
        },
        { once: true },
      );
    });
  const bg = queue.run('bg', 'fundo', work).catch(() => 0);
  const x = queue.run('x', 'consulta', work);
  const same = queue.run('x', 'consulta', work);
  expect(same).toBe(x);
  const y = queue.run('y', 'consulta', work);
  await Promise.resolve();
  expect(max).toBeLessThanOrEqual(2);
  queue.prioritize();
  await Promise.resolve();
  await Promise.resolve();
  for (const finish of finishes.slice(1)) finish();
  await Promise.all([bg, x, y]);
  expect(max).toBeLessThanOrEqual(2);
});
it('não acumula ciclos ocultos; falhas 10/20/30min, sucesso 5min, retorno após 60s', async () => {
  vi.useFakeTimers();
  let visible = true;
  let online = true;
  let lastVerification = performance.now();
  const verify = vi.fn().mockResolvedValue(false);
  const s = new VerificationScheduler({
    verify,
    lastVerification: () => lastVerification,
    visible: () => visible,
    online: () => online,
    random: () => 0.5,
  });
  s.start();
  await vi.advanceTimersByTimeAsync(300000);
  expect(verify).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(600000);
  expect(verify).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(1200000);
  expect(verify).toHaveBeenCalledTimes(3);
  visible = false;
  await s.visibilityChanged();
  await vi.advanceTimersByTimeAsync(3600000);
  expect(verify).toHaveBeenCalledTimes(3);
  visible = true;
  verify.mockImplementation(() => {
    lastVerification = performance.now();
    return Promise.resolve(true);
  });
  await s.visibilityChanged();
  expect(verify).toHaveBeenCalledTimes(4);
  online = false;
  await s.connectionChanged();
  await vi.advanceTimersByTimeAsync(300000);
  expect(verify).toHaveBeenCalledTimes(4);
  online = true;
  await s.connectionChanged();
  expect(verify).toHaveBeenCalledTimes(5);
  s.dispose();
  vi.useRealTimers();
});
it('alerta depois de 15 minutos sem sucesso, sem relógio civil como ordem', async () => {
  vi.useFakeTimers();
  let clock = 0;
  const stale: boolean[] = [];
  const s = new VerificationScheduler({
    verify: () => Promise.resolve(false),
    lastVerification: () => null,
    visible: () => true,
    online: () => true,
    now: () => clock,
    onAge: (v) => stale.push(v),
    random: () => 0.5,
  });
  s.start();
  clock = 900001;
  await vi.advanceTimersByTimeAsync(30000);
  expect(stale.at(-1)).toBe(true);
  s.dispose();
  vi.useRealTimers();
});
