import { expect, it } from 'vitest';
import { createModuleLoader } from './module-loader';

it('recupera importação cuja rejeição ficou em cache mesmo depois do arquivo voltar', async () => {
  let available = false;
  const cache = new Map<string, Promise<{ default: string }>>();
  const importModule = (url: string) => {
    let module = cache.get(url);
    if (!module) {
      module = available
        ? Promise.resolve({ default: 'gráfico recuperado' })
        : Promise.reject(new TypeError('404: módulo indisponível'));
      cache.set(url, module);
    }
    return module;
  };
  const load = createModuleLoader(
    () => importModule('/assets/chart.js'),
    '/assets/chart.js',
    importModule,
  );
  await expect(load()).rejects.toThrow('404');
  // O navegador conserva a rejeição desta URL; disponibilidade do servidor não a desfaz.
  available = true;
  await expect(importModule('/assets/chart.js')).rejects.toThrow('404');
  await expect(load()).resolves.toEqual({ default: 'gráfico recuperado' });
});

it('permite tentativas manuais sucessivas sem repetir importações já concluídas', async () => {
  let available = false;
  let requests = 0;
  const cache = new Map<string, Promise<{ default: string }>>();
  const importModule = (url: string) => {
    let module = cache.get(url);
    if (!module) {
      requests++;
      module = available
        ? Promise.resolve({ default: 'gráfico' })
        : Promise.reject(new Error('404'));
      cache.set(url, module);
    }
    return module;
  };
  const load = createModuleLoader(
    () => importModule('/assets/chart.js'),
    '/assets/chart.js',
    importModule,
  );
  await expect(load()).rejects.toThrow('404');
  await expect(load()).rejects.toThrow('404');
  available = true;
  await expect(load()).resolves.toEqual({ default: 'gráfico' });
  const before = requests;
  await expect(load()).resolves.toEqual({ default: 'gráfico' });
  expect(requests).toBe(before);
});
