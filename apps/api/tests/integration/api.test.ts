import { afterAll, beforeAll, expect, test } from 'vitest';
import { rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { Historico, Resumo } from '@pecuaria/contracts/types';
import { assertHistorico, assertResumo, canonicalJson } from '@pecuaria/contracts/server';
import errors from '../../../../docs/superpowers/contracts/v0.1/erros.exemplos.json' with { type: 'json' };
import { startDatabase, type TestDatabase } from './helpers/database.js';
import { csvPrices, duringPublication } from './helpers/query-fixtures.js';
import { buildApp } from '../../src/app.js';
import { createRepository } from '../../src/db/repository.js';
import { validarBase, type BaseValidada } from '../../src/demo/validate.js';
import { publicarBase } from '../../src/db/publication.js';
import { cloneDemo, newVersion, originalDirectory } from '../helpers/demo-files.js';
import {
  permissiveDependencies,
  resumoUrl,
  historicoUrl,
  versionId,
  profileId,
  historyQuery,
} from '../helpers/http.js';
let database: TestDatabase;
let base: BaseValidada;
let app: FastifyInstance;
const clones: string[] = [];
beforeAll(async () => {
  database = await startDatabase();
  base = await validarBase(originalDirectory);
  app = await buildApp(permissiveDependencies(createRepository(database.handles.consulta)));
});
afterAll(async () => {
  try {
    await app?.close();
    await database?.close();
  } finally {
    await Promise.all(clones.map((d) => rm(d, { recursive: true, force: true })));
  }
});
test('prontidão real exige esquema e publicação e não inicializa os dados', async () => {
  const response = await app.inject('/internal/ready');
  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual(errors[6]?.corpo);
  expect(response.headers['cache-control']).toBe('no-store');
  expect(
    (await database.handles.consulta.pool.query('SELECT 1 FROM mercado.versoes_dados')).rows,
  ).toHaveLength(0);
  expect((await app.inject(resumoUrl)).statusCode).toBe(503);
  await publicarBase(database.handles.publicador, base, 'inicial');
  expect((await app.inject('/internal/ready')).json()).toEqual({ ready: true });
});
test('HTTP entrega resumo/históricos reais, CSV integral e hash do corpo canônico', async () => {
  const response = await app.inject(resumoUrl);
  expect(response.statusCode).toBe(200);
  const resumo = response.json<Resumo>();
  assertResumo(resumo);
  expect(response.body).toBe(canonicalJson(resumo));
  expect(response.headers.etag).toBe(
    `W/"v1-resumo-${createHash('sha256').update(response.body).digest('hex')}"`,
  );
  expect(resumo.precos).toEqual(
    csvPrices.filter((p) => p.semana === '2026-09-21' || p.semana === '2026-09-28'),
  );
  for (const perfil of resumo.perfis) {
    const history = await app.inject(
      `${historicoUrl}?versaoDados=${resumo.versaoDados}&perfilId=${perfil.id}`,
    );
    expect(history.statusCode).toBe(200);
    const historico = history.json<Historico>();
    assertHistorico(historico, resumo, perfil.id);
    expect(historico.precos).toEqual(csvPrices.filter((p) => p.perfilId === perfil.id));
    const checked = await app.inject({
      url: `${historicoUrl}?perfilId=${perfil.id}&versaoDados=${resumo.versaoDados}`,
      headers: { 'if-none-match': String(history.headers.etag).slice(2) },
    });
    expect(checked.statusCode).toBe(304);
    expect(checked.body).toBe('');
    expect(checked.headers.etag).toBe(history.headers.etag);
    expect(checked.headers['cache-control']).toBe('public, max-age=60, must-revalidate');
  }
});
test('publicação real muda etiqueta e retém histórico antigo sem misturar fotografias', async () => {
  const first = await app.inject(resumoUrl);
  const originalHistory = await app.inject(`${historicoUrl}?${historyQuery}`);
  const directory = await cloneDemo();
  clones.push(directory);
  await newVersion(directory, 'a-publicacao-http');
  const candidate = await validarBase(directory);
  await duringPublication(database, candidate, async () => {
    const checked = await app.inject({
      url: resumoUrl,
      headers: { 'if-none-match': String(first.headers.etag) },
    });
    expect(checked.statusCode).toBe(304);
    expect(checked.body).toBe('');
    expect(
      (
        await app.inject(
          `${historicoUrl}?perfilId=${profileId}&versaoDados=${candidate.manifesto.versaoDados}`,
        )
      ).statusCode,
    ).toBe(409);
  });
  const next = await app.inject({
    url: resumoUrl,
    headers: { 'if-none-match': String(first.headers.etag) },
  });
  expect(next.statusCode).toBe(200);
  expect(next.headers.etag).not.toBe(first.headers.etag);
  const resumo = next.json<Resumo>();
  assertResumo(resumo);
  expect(resumo.versaoDados).toBe('a-publicacao-http');
  const history = await app.inject(
    `${historicoUrl}?perfilId=${profileId}&versaoDados=a-publicacao-http`,
  );
  assertHistorico(history.json(), resumo, profileId);
  const retained = await app.inject(`${historicoUrl}?${historyQuery}`);
  expect(retained.body).toBe(originalHistory.body);
  expect(retained.headers.etag).toBe(originalHistory.headers.etag);
});
test('HTTP hostil não altera banco e preserva 409 antes de 404 mesmo com asterisco', async () => {
  const invalid = await app.inject(
    `${historicoUrl}?perfilId=${encodeURIComponent("' OR 1=1 --")}&versaoDados=${versionId}`,
  );
  expect(invalid.statusCode).toBe(400);
  const missing = await app.inject({
    url: `${historicoUrl}?perfilId=inexistente&versaoDados=inexistente`,
    headers: { 'if-none-match': '*' },
  });
  expect(missing.statusCode).toBe(409);
  expect(missing.json()).toEqual(errors[2]?.corpo);
  expect(
    (await app.inject(`${historicoUrl}?perfilId=inexistente&versaoDados=${versionId}`)).statusCode,
  ).toBe(404);
  expect(
    (
      await database.handles.consulta.pool.query(
        'SELECT count(*)::int AS count FROM mercado.precos',
      )
    ).rows[0],
  ).toEqual({ count: 8292 });
});
test('prontidão rejeita publicação incompatível sem substituí-la automaticamente', async () => {
  const { manifestFor, insertVersion, insertCatalog, insertPrices, finalize } =
    await import('./helpers/fixtures.js');
  const manifest = manifestFor('incompativel-http');
  manifest.versaoTerritorial = 'territorio-incompativel';
  manifest.referencias.push({ ...manifest.referencias[1]!, id: manifest.versaoTerritorial });
  const client = await database.handles.publicador.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM mercado.publicacao_atual WHERE id=1 FOR UPDATE');
    await insertVersion(client, 'incompativel-http', manifest);
    await insertCatalog(client, 'incompativel-http');
    await insertPrices(client, 'incompativel-http');
    await finalize(client, 'incompativel-http');
    await client.query('UPDATE mercado.publicacao_atual SET versao_dados=$1 WHERE id=1', [
      'incompativel-http',
    ]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const response = await app.inject('/internal/ready');
  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual(errors[6]?.corpo);
  expect(
    (
      await database.handles.consulta.pool.query(
        'SELECT versao_dados FROM mercado.publicacao_atual WHERE id=1',
      )
    ).rows[0],
  ).toEqual({ versao_dados: 'incompativel-http' });
});
test('cache de resumo não confirma 304 quando conexão real fica indisponível', async () => {
  // Select a compatible retained pointer with the explicit publisher role.
  await database.handles.publicador.pool.query(
    'UPDATE mercado.publicacao_atual SET versao_dados=$1 WHERE id=1',
    ['a-publicacao-http'],
  );
  const first = await app.inject(resumoUrl);
  expect(first.statusCode).toBe(200);
  await database.handles.consulta.pool.query('SELECT 1');
  await database.handles.migracao.pool.query(
    'REVOKE SELECT ON mercado.publicacao_atual FROM mercado_consulta',
  );
  const response = await app.inject({
    url: resumoUrl,
    headers: { 'if-none-match': String(first.headers.etag) },
  });
  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual(errors[6]?.corpo);
  expect(response.headers['cache-control']).toBe('no-store');
  expect(response.body).not.toMatch(/SELECT|pool|connection|mercado|publicacao_atual/i);
  expect((await app.inject('/internal/ready')).statusCode).toBe(503);
});
