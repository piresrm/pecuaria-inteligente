import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
export const originalDirectory = fileURLToPath(
  new URL('../../../../data/demonstrativa/v0.1/', import.meta.url),
);
export const names = [
  'cenarios.json',
  'manifesto.json',
  'perfis.json',
  'precos.csv',
  'receita.json',
  'regioes.json',
];
export async function cloneDemo(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'pecuaria-demo-'));
  await cp(originalDirectory, directory, { recursive: true });
  return directory;
}
export async function updateHashes(directory: string): Promise<void> {
  const lines = await Promise.all(
    names.map(
      async (name) => `${createHash('sha256')
        .update(await readFile(join(directory, name)))
        .digest('hex')}  ${name}
`,
    ),
  );
  await writeFile(join(directory, 'SHA256SUMS'), lines.join(''));
}
export async function newVersion(directory: string, id: string): Promise<void> {
  for (const name of ['manifesto.json', 'cenarios.json', 'precos.csv']) {
    const text = await readFile(join(directory, name), 'utf8');
    await writeFile(join(directory, name), text.replaceAll('go-reposicao-demo-2026-10-07-r1', id));
  }
  await updateHashes(directory);
}
