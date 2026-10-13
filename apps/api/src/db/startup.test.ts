import { expect, test } from 'vitest';
import { abrirConexaoInicial } from './startup.js';

test('repete somente abertura, cinco vezes, com pausas de dois segundos', async () => {
  let attempts = 0;
  const pauses: number[] = [];
  const pool = {
    connect() {
      attempts++;
      return Promise.reject(new Error('indisponível'));
    },
  };
  await expect(
    abrirConexaoInicial(
      pool,
      () => false,
      (ms) => {
        pauses.push(ms);
        return Promise.resolve();
      },
    ),
  ).rejects.toThrow('indisponível');
  expect(attempts).toBe(5);
  expect(pauses).toEqual([2000, 2000, 2000, 2000]);
});
test('abertura bem sucedida libera cliente e não executa escrita ou leitura', async () => {
  let attempts = 0;
  let released = 0;
  const pool = {
    connect() {
      if (++attempts < 3) return Promise.reject(new Error('temporário'));
      return Promise.resolve({
        release() {
          released++;
        },
      });
    },
  };
  await abrirConexaoInicial(
    pool,
    () => false,
    () => Promise.resolve(),
  );
  expect(attempts).toBe(3);
  expect(released).toBe(1);
});
test('cancelamento durante pausa impede novas aberturas', async () => {
  let cancelled = false;
  let attempts = 0;
  const pool = {
    connect() {
      attempts++;
      return Promise.reject(new Error('temporário'));
    },
  };
  await expect(
    abrirConexaoInicial(
      pool,
      () => cancelled,
      () => {
        cancelled = true;
        return Promise.resolve();
      },
    ),
  ).rejects.toThrow('Inicialização cancelada');
  expect(attempts).toBe(1);
});
