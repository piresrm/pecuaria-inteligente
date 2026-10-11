import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import type { PrecoRegional } from '@pecuaria/contracts/types';
import type { Publicacao } from '../../src/db/publication.js';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { rm } from 'node:fs/promises';
import { startDatabase, type TestDatabase } from './helpers/database.js';
import { createDatabase, type DatabaseHandle } from '../../src/db/client.js';
import { validarBase, type BaseValidada } from '../../src/demo/validate.js';
import { publicarBase } from '../../src/db/publication.js';
import { cloneDemo, newVersion, originalDirectory } from '../helpers/demo-files.js';
import {
  insertCatalog,
  insertPrices,
  insertVersion,
  manifestFor,
  finalize,
} from './helpers/fixtures.js';
let database: TestDatabase;
let original: BaseValidada;
const clones: string[] = [];
beforeAll(async () => {
  database = await startDatabase();
  original = await validarBase(originalDirectory);
});
afterAll(async () => {
  try {
    await database?.close();
  } finally {
    await Promise.all(clones.map((d) => rm(d, { recursive: true, force: true })));
  }
});
async function version(id: string) {
  const d = await cloneDemo();
  clones.push(d);
  await newVersion(d, id);
  return validarBase(d);
}
async function state() {
  const current = await database.handles.consulta.pool.query<{ versao_dados: string | null }>(
    'SELECT versao_dados FROM mercado.publicacao_atual WHERE id=1',
  );
  const versions = await database.handles.consulta.pool.query<{
    versao_dados: string;
    publicado_em: Date;
    estado: string;
    precos: number;
  }>(
    'SELECT v.versao_dados,v.publicado_em,v.estado,(SELECT count(*)::int FROM mercado.precos p WHERE p.versao_dados=v.versao_dados) AS precos FROM mercado.versoes_dados v ORDER BY versao_dados',
  );
  return { current: current.rows[0]?.versao_dados, versions: versions.rows };
}
test('publica integralmente e retorna instante gerado pelo servidor', async () => {
  const before = await database.handles.consulta.pool.query<{ now: Date }>(
    'SELECT clock_timestamp() AS now',
  );
  const result = await publicarBase(database.handles.publicador, original, 'inicial');
  const after = await database.handles.consulta.pool.query<{ now: Date }>(
    'SELECT clock_timestamp() AS now',
  );
  expect(result).toMatchObject({
    versaoDados: original.manifesto.versaoDados,
    resultado: 'publicada',
  });
  expect(result.publicadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  expect(Date.parse(result.publicadoEm)).toBeGreaterThanOrEqual(
    (before.rows[0]?.now.getTime() ?? 0) - 1,
  );
  expect(Date.parse(result.publicadoEm)).toBeLessThanOrEqual(
    (after.rows[0]?.now.getTime() ?? 0) + 1,
  );
  const s = await state();
  expect(s.current).toBe(result.versaoDados);
  expect(s.versions).toHaveLength(1);
  expect(s.versions[0]).toMatchObject({ estado: 'publicada', precos: 4146 });
  const loaded = await database.handles.consulta.pool.query<PrecoRegional>(
    `SELECT p.perfil_id AS "perfilId",p.regiao_id AS "regiaoId",p.semana,p.preco,p.moeda,p.unidade_preco AS "unidadePreco",p.natureza,v.conjunto_id AS "conjuntoId",p.condicoes_id AS "condicoesComerciaisId" FROM mercado.precos p JOIN mercado.versoes_dados v USING (versao_dados) JOIN mercado.perfis f USING (versao_dados,perfil_id) JOIN mercado.regioes r USING (versao_dados,regiao_id) WHERE p.versao_dados=$1 ORDER BY p.semana,f.ordem,r.ordem`,
    [result.versaoDados],
  );
  expect(loaded.rows).toEqual(original.precos);
});
test('repetir versão antiga mantém ponteiro novo e instante original', async () => {
  const first = (await state()).versions[0]?.publicado_em.toISOString();
  const newer = await version('a-identidade-sem-ordem');
  const published = await publicarBase(database.handles.publicador, newer, 'explicito');
  const repeated = await publicarBase(database.handles.publicador, original, 'explicito');
  expect(repeated).toEqual({
    versaoDados: original.manifesto.versaoDados,
    publicadoEm: first,
    resultado: 'existente',
  });
  expect((await state()).current).toBe(published.versaoDados);
  expect((await state()).versions).toHaveLength(2);
});
test('preparação inicial preserva publicação compatível sem inserir candidata', async () => {
  const before = await state();
  const candidate = await version('inicial-nao-substitui');
  const result = await publicarBase(database.handles.publicador, candidate, 'inicial');
  const current = before.versions.find((v) => v.versao_dados === before.current);
  expect(result).toEqual({
    versaoDados: before.current,
    publicadoEm: current?.publicado_em.toISOString(),
    resultado: 'preservada',
  });
  expect(await state()).toEqual(before);
});
test('conflito de identidade nunca sobrescreve conteúdo ou instante', async () => {
  const before = await state();
  await expect(
    publicarBase(
      database.handles.publicador,
      { ...original, hashConjuntoSha256: '0'.repeat(64) },
      'explicito',
    ),
  ).rejects.toThrow(/conflito/i);
  expect(await state()).toEqual(before);
});
test('falha durante carga parcial desfaz todas as tabelas e preserva publicação', async () => {
  const candidate = await version('falha-parcial');
  const before = await state();
  await database.handles.migracao.pool.query(
    `CREATE FUNCTION mercado.falha_teste() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.versao_dados='falha-parcial' AND NEW.semana='2026-09-28' THEN RAISE EXCEPTION 'Falha parcial planejada depois de % preços', (SELECT count(*) FROM mercado.precos WHERE versao_dados=NEW.versao_dados); END IF; RETURN NEW; END $$; CREATE TRIGGER falha_teste BEFORE INSERT ON mercado.precos FOR EACH ROW EXECUTE FUNCTION mercado.falha_teste()`,
  );
  try {
    await expect(
      publicarBase(database.handles.publicador, candidate, 'explicito'),
    ).rejects.toMatchObject({
      cause: { code: 'P0001', message: 'Falha parcial planejada depois de 4068 preços' },
    });
    expect(await state()).toEqual(before);
    for (const table of ['perfis', 'regioes', 'municipios', 'condicoes_comerciais', 'precos']) {
      const result = await database.handles.consulta.pool.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM mercado.${table} WHERE versao_dados=$1`,
        ['falha-parcial'],
      );
      expect(result.rows[0]?.count).toBe(0);
    }
  } finally {
    await database.handles.migracao.pool.query(
      'DROP TRIGGER falha_teste ON mercado.precos; DROP FUNCTION mercado.falha_teste()',
    );
  }
});
test('COMMIT sem finalizar não persiste preparação nem cadastros/preços', async () => {
  const before = await state();
  const client = await database.handles.publicador.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM mercado.publicacao_atual WHERE id=1 FOR UPDATE');
    await insertVersion(client, 'sem-finalizar');
    await insertCatalog(client, 'sem-finalizar');
    await insertPrices(client, 'sem-finalizar', 100);
    await expect(client.query('COMMIT')).rejects.toMatchObject({ code: '23514' });
  } finally {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }
  expect(await state()).toEqual(before);
  const prices = await database.handles.consulta.pool.query(
    'SELECT 1 FROM mercado.precos WHERE versao_dados=$1',
    ['sem-finalizar'],
  );
  expect(prices.rows).toEqual([]);
});
async function concurrent(first: BaseValidada, second: BaseValidada) {
  const handles: DatabaseHandle[] = [
    createDatabase(database.configs.publicador),
    createDatabase(database.configs.publicador),
  ];
  const blocker = await database.handles.migracao.pool.connect();
  let jobs: ReturnType<typeof publicarBase>[] = [];
  try {
    await blocker.query('BEGIN');
    await blocker.query('SELECT id FROM mercado.publicacao_atual WHERE id=1 FOR UPDATE');
    jobs = [
      publicarBase(handles[0]!, first, 'explicito'),
      publicarBase(handles[1]!, second, 'explicito'),
    ];
    const deadline = performance.now() + 5000;
    while (true) {
      const pending = await blocker.query<{ count: number }>(
        'SELECT count(*)::int AS count FROM pg_locks WHERE NOT granted',
      );
      if ((pending.rows[0]?.count ?? 0) >= 2) break;
      if (performance.now() > deadline)
        throw new Error('Publicadores não aguardaram o bloqueio independente');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    const visible = await state();
    expect(visible.versions.some((v) => v.versao_dados === first.manifesto.versaoDados)).toBe(
      false,
    );
    await blocker.query('COMMIT');
    return await Promise.all(jobs);
  } finally {
    try {
      await blocker.query('ROLLBACK');
    } finally {
      blocker.release();
    }
    await Promise.allSettled(jobs);
    await Promise.all(handles.map((h) => h.close()));
  }
}
test('duas conexões publicam versões distintas inteiras e retidas', async () => {
  const a = await version('z-concorrente');
  const b = await version('b-concorrente');
  const result = await concurrent(a, b);
  expect(result.map((r) => r.resultado)).toEqual(['publicada', 'publicada']);
  const s = await state();
  expect([a.manifesto.versaoDados, b.manifesto.versaoDados]).toContain(s.current);
  for (const base of [a, b])
    expect(s.versions.find((v) => v.versao_dados === base.manifesto.versaoDados)).toMatchObject({
      estado: 'publicada',
      precos: 4146,
    });
});
test('mesma identidade concorrente é publicada uma vez com o mesmo instante', async () => {
  const base = await version('concorrente-identica');
  const result = await concurrent(base, base);
  expect(result.map((r) => r.resultado).sort()).toEqual(['existente', 'publicada']);
  expect(result[0]?.publicadoEm).toBe(result[1]?.publicadoEm);
  expect(
    (await state()).versions.filter((v) => v.versao_dados === base.manifesto.versaoDados),
  ).toHaveLength(1);
});
async function cli(
  operation: 'prepare' | 'publish',
  directory?: string,
  role: 'publicador' | 'consulta' = 'publicador',
): Promise<Publicacao> {
  const config = database.configs[role];
  const path = fileURLToPath(new URL(`../../src/operations/${operation}.ts`, import.meta.url));
  const output = await promisify(execFile)(
    process.execPath,
    ['--import', 'tsx', path, ...(directory ? [directory] : [])],
    {
      timeout: 5000,
      cwd: fileURLToPath(new URL('../../../../', import.meta.url)),
      env: {
        ...process.env,
        DB_HOST: config.host,
        DB_PORT: String(config.port),
        DB_NAME: config.database,
        DB_USER: config.user,
        DB_PASSWORD_FILE: config.passwordFile,
      },
    },
  );
  return JSON.parse(output.stdout) as Publicacao;
}
test('comandos reais publicam, preservam preparação e encerram conexões', async () => {
  const directory = await cloneDemo();
  clones.push(directory);
  await newVersion(directory, 'operacao-cli');
  const result = await cli('publish', directory);
  expect(result.resultado).toBe('publicada');
  expect(await cli('prepare')).toEqual({ ...result, resultado: 'preservada' });
  expect(await cli('publish', directory)).toEqual({ ...result, resultado: 'existente' });
  expect((await state()).current).toBe(result.versaoDados);
});
test('comando encerra conexões também quando o papel não pode publicar', async () => {
  const before = await state();
  await expect(cli('publish', originalDirectory, 'consulta')).rejects.toMatchObject({
    code: 1,
    killed: false,
  });
  expect(await state()).toEqual(before);
});
test('preparação inicial rejeita ponteiro incompatível', async () => {
  const client = await database.handles.publicador.pool.connect();
  const m = manifestFor('incompativel');
  m.versaoTerritorial = 'territorio-incompativel';
  m.referencias.push({ ...m.referencias[1]!, id: m.versaoTerritorial });
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM mercado.publicacao_atual WHERE id=1 FOR UPDATE');
    await insertVersion(client, 'incompativel', m);
    await insertCatalog(client, 'incompativel');
    await insertPrices(client, 'incompativel');
    await finalize(client, 'incompativel');
    await client.query('UPDATE mercado.publicacao_atual SET versao_dados=$1 WHERE id=1', [
      'incompativel',
    ]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const before = await state();
  await expect(publicarBase(database.handles.publicador, original, 'inicial')).rejects.toThrow(
    /compat/i,
  );
  expect(await state()).toEqual(before);
});
