import { afterEach, expect, test } from 'vitest';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  cloneDemo,
  newVersion,
  originalDirectory,
  updateHashes,
} from '../../tests/helpers/demo-files.js';
import { validarBase } from './validate.js';
const clones: string[] = [];
afterEach(async () => {
  await Promise.all(
    clones.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});
async function clone() {
  const directory = await cloneDemo();
  clones.push(directory);
  return directory;
}
test('valida 4146 preços, seis arquivos e 94 lacunas sem completar ausências', async () => {
  const base = await validarBase(originalDirectory);
  expect(base.precos).toHaveLength(4146);
  expect(base.perfis).toHaveLength(8);
  expect(base.regioes).toHaveLength(10);
  expect(base.regioes.flatMap((r) => r.municipios)).toHaveLength(246);
  expect(base.hashConjuntoSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(Object.keys(base.arquivos)).toHaveLength(6);
  expect(base.precos.filter((p) => p.semana === '2026-02-02')).toEqual([]);
  expect(
    base.precos.find(
      (p) =>
        p.semana === '2026-09-28' &&
        p.perfilId === 'bezerro-macho-nelore' &&
        p.regiaoId === 'sudoeste-goiano',
    )?.preco,
  ).toBe('3150.00');
  expect(base.manifesto.contagens.lacunas).toBe(94);
});
test('aceita nova identidade dos arquivos sem inferir ordem', async () => {
  const directory = await clone();
  await newVersion(directory, 'a-antiga-identidade');
  expect((await validarBase(directory)).manifesto.versaoDados).toBe('a-antiga-identidade');
});
test('rejeita bytes adulterados mesmo mantendo JSON válido', async () => {
  const directory = await clone();
  await writeFile(
    join(directory, 'manifesto.json'),
    (await readFile(join(directory, 'manifesto.json'), 'utf8')) + ' ',
  );
  await expect(validarBase(directory)).rejects.toThrow(/SHA-256/);
});
test.each([
  ['duplicata', (text: string) => text + text.split('\n')[1] + '\n', /duplicad|receita|contagem/i],
  ['escala', (text: string) => text.replace('3417.59', '3417.590'), /decimal|preço|contrato/i],
  ['receita divergente', (text: string) => text.replace('3417.59', '3417.60'), /receita/i],
  ['lacuna preenchida', (text: string) => text.replace('2025-09-29', '2026-02-02'), /receita/i],
])('rejeita %s antes de qualquer SQL, mesmo com hashes refeitos', async (_, change, message) => {
  const directory = await clone();
  const path = join(directory, 'precos.csv');
  await writeFile(path, change(await readFile(path, 'utf8')));
  await updateHashes(directory);
  await expect(validarBase(directory)).rejects.toThrow(message);
});
test('rejeita cadastros territoriais adulterados com hashes refeitos', async () => {
  const directory = await clone();
  const path = join(directory, 'regioes.json');
  await writeFile(path, (await readFile(path, 'utf8')).replace('Abadia de Goiás', 'Outra cidade'));
  await updateHashes(directory);
  await expect(validarBase(directory)).rejects.toThrow(/cadastro|territ/i);
});
test('aceita contagens de outro conjunto conforme sua própria receita', async () => {
  const directory = await clone();
  await newVersion(directory, 'nova-contagem');
  const csvPath = join(directory, 'precos.csv');
  const lines = (await readFile(csvPath, 'utf8')).split('\n');
  lines.splice(1, 1);
  await writeFile(csvPath, lines.join('\n'));
  const recipePath = join(directory, 'receita.json');
  const recipe = JSON.parse(await readFile(recipePath, 'utf8')) as { lacunas: unknown[] };
  recipe.lacunas.push({
    semana: '2025-09-29',
    perfilId: 'bezerro-macho-nelore',
    regiaoId: 'metropolitana-goiania',
    motivo: 'Nova lacuna de teste',
  });
  await writeFile(recipePath, JSON.stringify(recipe, null, 2) + '\n');
  const manifestPath = join(directory, 'manifesto.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    contagens: { precos: number; precosSemanaAnterior: number; lacunas: number };
  };
  manifest.contagens.precos = 4145;
  manifest.contagens.precosSemanaAnterior = 79;
  manifest.contagens.lacunas = 95;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  await updateHashes(directory);
  expect((await validarBase(directory)).precos).toHaveLength(4145);
});
test('rejeita cenários sem os casos estruturais esperados mesmo com hashes refeitos', async () => {
  const directory = await clone();
  await writeFile(
    join(directory, 'cenarios.json'),
    JSON.stringify({
      versaoCenarios: '1',
      conjuntoId: 'go-reposicao-demo-2026-10-07-r1',
      casos: [],
    }) + '\n',
  );
  await updateHashes(directory);
  await expect(validarBase(directory)).rejects.toThrow(/cenário/i);
});
