import { afterAll, beforeAll, expect, test } from 'vitest';
import { rm } from 'node:fs/promises';
import { assertHistorico, assertResumo } from '@pecuaria/contracts/server';
import { startDatabase, type TestDatabase } from './helpers/database.js';
import { csvPrices, duringPublication } from './helpers/query-fixtures.js';
import { createRepository, type MercadoRepository } from '../../src/db/repository.js';
import { validarBase, type BaseValidada } from '../../src/demo/validate.js';
import { publicarBase } from '../../src/db/publication.js';
import { cloneDemo, newVersion, originalDirectory } from '../helpers/demo-files.js';
import { examples } from '../helpers/http.js';
let database: TestDatabase;
let repository: MercadoRepository;
let base: BaseValidada;
const clones: string[] = [];
beforeAll(async () => {
  database = await startDatabase();
  repository = createRepository(database.handles.consulta);
  base = await validarBase(originalDirectory);
});
afterAll(async () => {
  try {
    await database?.close();
  } finally {
    await Promise.all(clones.map((d) => rm(d, { recursive: true, force: true })));
  }
});
test('base vazia não fornece versão ou recurso inventado', async () => {
  expect(await repository.lerVersaoAtual()).toBeNull();
  expect(await repository.lerResumo(base.manifesto.versaoDados)).toBeNull();
  expect(
    await repository.lerHistorico(base.manifesto.versaoDados, 'bezerro-macho-nelore'),
  ).toBeNull();
});
test('resumo projeta catálogo e últimas duas segundas com preços integrais do CSV', async () => {
  const published = await publicarBase(database.handles.publicador, base, 'inicial');
  expect(await repository.lerVersaoAtual()).toBe(published.versaoDados);
  const resumo = await repository.lerResumo(published.versaoDados);
  assertResumo(resumo);
  expect(resumo).toEqual({ ...examples().resumo, publicadoEm: published.publicadoEm });
  expect(resumo.precos).toEqual(
    csvPrices.filter((p) => p.semana === '2026-09-21' || p.semana === '2026-09-28'),
  );
  expect(resumo.referenciasSemanais).toHaveLength(16);
  expect(resumo.precos).toHaveLength(156);
  expect(JSON.stringify(resumo)).not.toContain('manifesto');
  expect(JSON.stringify(resumo)).not.toContain('codigoIbge');
});
test('oito históricos preservam todos os 4.146 preços, lacunas e ordem do CSV', async () => {
  const resumo = await repository.lerResumo(base.manifesto.versaoDados);
  assertResumo(resumo);
  const full = [];
  for (const perfil of resumo.perfis) {
    const historico = await repository.lerHistorico(resumo.versaoDados, perfil.id);
    assertHistorico(historico, resumo, perfil.id);
    expect(historico.precos).toEqual(csvPrices.filter((p) => p.perfilId === perfil.id));
    expect(historico.referenciasSemanais).toHaveLength(53);
    expect(historico.referenciasSemanais[0]?.semana).toBe('2025-09-29');
    expect(historico.referenciasSemanais.at(-1)?.semana).toBe('2026-09-28');
    if (perfil.id === 'bezerro-macho-nelore') {
      expect(historico).toEqual({ ...examples().historico, publicadoEm: resumo.publicadoEm });
      expect(
        historico.referenciasSemanais.find((r) => r.semana === '2026-02-02')?.regioesAusentes,
      ).toHaveLength(10);
    }
    full.push(...historico.precos);
  }
  expect(full).toHaveLength(4146);
});
test('entradas hostis são parâmetros e versões/perfis inexistentes não caem na atual', async () => {
  for (const versao of ["' OR 1=1 --", 'inexistente']) {
    expect(await repository.lerResumo(versao)).toBeNull();
    expect(await repository.lerHistorico(versao, 'bezerro-macho-nelore')).toBeNull();
  }
  expect(await repository.lerHistorico(base.manifesto.versaoDados, "' OR 1=1 --")).toBeNull();
  expect(await repository.lerVersaoAtual()).toBe(base.manifesto.versaoDados);
});
test('leitura durante carga real vê somente versão inteira e mantém antiga após COMMIT', async () => {
  const directory = await cloneDemo();
  clones.push(directory);
  await newVersion(directory, 'a-nova-sem-ordem');
  const candidate = await validarBase(directory);
  const fixed = await repository.lerVersaoAtual();
  const old = await repository.lerResumo(fixed!);
  const observed = await duringPublication(database, candidate, async () => {
    expect(await repository.lerVersaoAtual()).toBe(fixed);
    expect(await repository.lerResumo(candidate.manifesto.versaoDados)).toBeNull();
    const snapshot = await repository.lerResumo(fixed!);
    expect(snapshot).toEqual(old);
    const history = await repository.lerHistorico(fixed!, 'bezerro-macho-nelore');
    assertResumo(snapshot);
    assertHistorico(history, snapshot, 'bezerro-macho-nelore');
    return snapshot;
  });
  expect(await repository.lerVersaoAtual()).toBe(candidate.manifesto.versaoDados);
  expect(await repository.lerResumo(fixed!)).toEqual(observed);
  const current = await repository.lerResumo(candidate.manifesto.versaoDados);
  assertResumo(current);
  expect(current.versaoDados).toBe('a-nova-sem-ordem');
});
test('janela com 53 semanas emite 54 referências e semanas finais sem preços', async () => {
  const { manifestFor, insertVersion, insertCatalog, finalize } =
    await import('./helpers/fixtures.js');
  const manifest = manifestFor('janela-53');
  manifest.janela = {
    ...manifest.janela,
    inicio: '2024-01-01',
    fim: '2024-12-31',
    primeiraSemana: '2024-01-01',
    ultimaSemana: '2024-12-30',
    semanaAnterior: '2023-12-25',
    quantidadeSemanasNaJanela: 53,
    quantidadeSemanasComAnterior: 54,
  };
  manifest.contagens = {
    ...manifest.contagens,
    combinacoesPossiveis: 4320,
    precos: 0,
    lacunas: 4320,
    precosNaJanela: 0,
    precosSemanaAnterior: 0,
  };
  const client = await database.handles.publicador.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM mercado.publicacao_atual WHERE id=1 FOR UPDATE');
    await insertVersion(client, 'janela-53', manifest);
    await insertCatalog(client, 'janela-53');
    await finalize(client, 'janela-53');
    await client.query('UPDATE mercado.publicacao_atual SET versao_dados=$1 WHERE id=1', [
      'janela-53',
    ]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const resumo = await repository.lerResumo('janela-53');
  assertResumo(resumo);
  expect(resumo.precos).toEqual([]);
  expect(resumo.referenciasSemanais.map((r) => r.semana)).toEqual([
    ...Array<string>(8).fill('2024-12-23'),
    ...Array<string>(8).fill('2024-12-30'),
  ]);
  expect(resumo.referenciasSemanais.every((r) => r.regioesAusentes.length === 10)).toBe(true);
  const historico = await repository.lerHistorico('janela-53', 'bezerro-macho-nelore');
  assertHistorico(historico, resumo, 'bezerro-macho-nelore');
  expect(historico.referenciasSemanais).toHaveLength(54);
  expect(historico.referenciasSemanais[0]?.semana).toBe('2023-12-25');
  expect(historico.referenciasSemanais.at(-1)?.semana).toBe('2024-12-30');
});
