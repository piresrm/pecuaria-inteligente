import { afterEach, expect, test } from 'vitest';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cloneDemo } from '../../tests/helpers/demo-files.js';
import { prepararBase } from './prepare.js';
import { publicarDiretorio } from './publish.js';
const clones: string[] = [];
afterEach(async () => {
  await Promise.all(clones.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});
test.each([prepararBase, publicarDiretorio])(
  'valida arquivos antes de ler segredo ou abrir banco (%#)',
  async (operation) => {
    const directory = await cloneDemo();
    clones.push(directory);
    const path = join(directory, 'precos.csv');
    await writeFile(path, (await readFile(path, 'utf8')) + ' ');
    await expect(
      operation(
        {
          host: 'localhost',
          port: 1,
          database: 'indisponivel',
          user: 'indisponivel',
          passwordFile: join(directory, 'inexistente'),
        },
        directory,
      ),
    ).rejects.toThrow(/SHA-256/);
  },
);
