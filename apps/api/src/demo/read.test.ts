import { afterEach, expect, test } from 'vitest';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { lerArquivos } from './read.js';
import { cloneDemo, originalDirectory } from '../../tests/helpers/demo-files.js';
const clones: string[] = [];
afterEach(async () => {
  await Promise.all(clones.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});
test('identifica o conjunto pelos bytes de SHA256SUMS', async () => {
  const result = await lerArquivos(originalDirectory);
  expect(result.hashConjuntoSha256).toBe(
    '4da11dde85ba0f31f6d70bc9adba5992c1995e6604711476d884f89e811ffa0a',
  );
});
test.each(['0000  ../precos.csv\n', '', 'duplicado'])(
  'rejeita manifesto de somas inválido %s',
  async (value) => {
    const d = await cloneDemo();
    clones.push(d);
    const sums = await readFile(join(d, 'SHA256SUMS'), 'utf8');
    await writeFile(
      join(d, 'SHA256SUMS'),
      value === 'duplicado' ? sums + sums.split('\n')[0] + '\n' : value,
    );
    await expect(lerArquivos(d)).rejects.toThrow(/SHA-256/);
  },
);
