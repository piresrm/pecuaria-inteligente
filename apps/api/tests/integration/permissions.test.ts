import { afterAll, beforeAll, expect, test } from 'vitest';
import { startDatabase, type TestDatabase } from './helpers/database.js';
import { insertVersion, publishFixture, rollbackCase } from './helpers/fixtures.js';
let database: TestDatabase;
beforeAll(async () => {
  database = await startDatabase();
  const client = await database.handles.publicador.pool.connect();
  try {
    await publishFixture(client, 'publicada');
  } finally {
    client.release();
  }
});
afterAll(async () => {
  await database?.close();
});
test('usa três logins reais distintos sem superusuário ou associação à migração', async () => {
  for (const role of ['consulta', 'publicador', 'migracao'] as const) {
    const { rows } = await database.handles[role].pool.query<{
      current_user: string;
      rolsuper: boolean;
      rolcreatedb: boolean;
      rolcreaterole: boolean;
      member: boolean;
    }>(
      "SELECT current_user,rolsuper,rolcreatedb,rolcreaterole,pg_has_role(current_user,'mercado_migracao','MEMBER') AS member FROM pg_roles WHERE rolname=current_user",
    );
    expect(rows[0]).toEqual({
      current_user: `mercado_${role}`,
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
      member: role === 'migracao',
    });
  }
});
test('consulta lê conteúdo das sete tabelas e recebe decimal textual', async () => {
  for (const table of [
    'versoes_dados',
    'perfis',
    'regioes',
    'municipios',
    'condicoes_comerciais',
    'precos',
    'publicacao_atual',
  ]) {
    const { rows } = await database.handles.consulta.pool.query(
      `SELECT * FROM mercado.${table} LIMIT 1`,
    );
    expect(rows).toHaveLength(1);
  }
  expect(
    (
      await database.handles.consulta.pool.query<{ preco: string }>(
        'SELECT preco FROM mercado.precos LIMIT 1',
      )
    ).rows[0]?.preco,
  ).toEqual(expect.any(String));
});
test.each(['consulta', 'publicador'] as const)(
  '%s não cria objetos nem desativa gatilhos',
  async (role) => {
    for (const query of [
      'CREATE TABLE mercado.indevida(id int)',
      'CREATE TABLE public.indevida(id int)',
      'CREATE SCHEMA indevido',
      'ALTER TABLE mercado.precos DISABLE TRIGGER ALL',
      'SET ROLE mercado_migracao',
    ]) {
      await expect(database.handles[role].pool.query(query)).rejects.toMatchObject({
        code: '42501',
      });
    }
  },
);
test('somente migração executa DDL; privilégios padrão preservam leitura sem escrita', async () => {
  await database.handles.migracao.pool.query('CREATE TABLE mercado.evolucao_teste(id integer)');
  try {
    await expect(
      database.handles.consulta.pool.query('SELECT * FROM mercado.evolucao_teste'),
    ).resolves.toMatchObject({ rows: [] });
    await expect(
      database.handles.consulta.pool.query('INSERT INTO mercado.evolucao_teste VALUES (1)'),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      database.handles.publicador.pool.query('INSERT INTO mercado.evolucao_teste VALUES (1)'),
    ).rejects.toMatchObject({ code: '42501' });
  } finally {
    await database.handles.migracao.pool.query('DROP TABLE mercado.evolucao_teste');
  }
});
test.each([
  'versoes_dados',
  'perfis',
  'regioes',
  'municipios',
  'condicoes_comerciais',
  'precos',
  'publicacao_atual',
])('consulta não escreve em %s', async (table) => {
  for (const query of [
    `UPDATE mercado.${table} SET versao_dados=versao_dados`,
    `DELETE FROM mercado.${table}`,
    `TRUNCATE mercado.${table} CASCADE`,
    `INSERT INTO mercado.${table} SELECT * FROM mercado.${table}`,
  ]) {
    await expect(database.handles.consulta.pool.query(query)).rejects.toMatchObject({
      code: '42501',
    });
  }
});
test.each(['perfis', 'regioes', 'municipios', 'condicoes_comerciais', 'precos'])(
  'publicador não insere, altera ou remove conteúdo publicado de %s',
  async (table) => {
    await expect(
      database.handles.publicador.pool.query(
        `INSERT INTO mercado.${table} SELECT * FROM mercado.${table} LIMIT 1`,
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      database.handles.publicador.pool.query(
        `UPDATE mercado.${table} SET versao_dados=versao_dados`,
      ),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      database.handles.publicador.pool.query(`DELETE FROM mercado.${table}`),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      database.handles.publicador.pool.query(`TRUNCATE mercado.${table} CASCADE`),
    ).rejects.toMatchObject({ code: '42501' });
  },
);
test.each([
  'versoes_dados',
  'perfis',
  'regioes',
  'municipios',
  'condicoes_comerciais',
  'precos',
  'publicacao_atual',
])('gatilhos também bloqueiam TRUNCATE do proprietário: %s', async (table) => {
  await expect(
    database.handles.migracao.pool.query(`TRUNCATE mercado.${table} CASCADE`),
  ).rejects.toMatchObject({ code: '23514' });
});
test('conteúdo e manifesto publicados permanecem imutáveis mesmo sob proprietário', async () => {
  for (const query of [
    "UPDATE mercado.versoes_dados SET manifesto='{}'",
    'UPDATE mercado.versoes_dados SET publicado_em=clock_timestamp()',
    'UPDATE mercado.perfis SET peso_referencia=1',
    'DELETE FROM mercado.precos',
    'DELETE FROM mercado.versoes_dados',
    'DELETE FROM mercado.publicacao_atual',
    'UPDATE mercado.publicacao_atual SET id=2',
  ]) {
    await expect(database.handles.migracao.pool.query(query)).rejects.toMatchObject({
      code: '23514',
    });
  }
});
test('publicador só altera colunas de finalização e versão do ponteiro', async () => {
  for (const query of [
    "UPDATE mercado.versoes_dados SET manifesto='{}'",
    'UPDATE mercado.publicacao_atual SET id=2',
    'DELETE FROM mercado.publicacao_atual',
    'INSERT INTO mercado.publicacao_atual VALUES(1,NULL)',
  ]) {
    await expect(database.handles.publicador.pool.query(query)).rejects.toMatchObject({
      code: '42501',
    });
  }
  await expect(
    database.handles.publicador.pool.query("UPDATE mercado.versoes_dados SET estado='publicada'"),
  ).rejects.toMatchObject({ code: '23514' });
});
test('ponteiro não volta a nulo nem referencia versão em preparação', async () => {
  await expect(
    database.handles.publicador.pool.query('UPDATE mercado.publicacao_atual SET versao_dados=NULL'),
  ).rejects.toMatchObject({ code: '23514' });
  await rollbackCase(database.handles.publicador.pool, async (client, id) => {
    await insertVersion(client, id);
    await expect(
      client.query('UPDATE mercado.publicacao_atual SET versao_dados=$1', [id]),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
test('falha antes da finalização mantém a publicação anterior visível em outra conexão', async () => {
  const writer = await database.handles.publicador.pool.connect();
  try {
    const reader = await database.handles.consulta.pool.connect();
    try {
      await writer.query('BEGIN');
      await writer.query('SELECT id FROM mercado.publicacao_atual FOR UPDATE');
      await insertVersion(writer, 'interrompida');
      expect(
        (
          await reader.query<{ versao_dados: string }>(
            'SELECT versao_dados FROM mercado.publicacao_atual',
          )
        ).rows[0]?.versao_dados,
      ).toBe('publicada');
      await expect(writer.query('COMMIT')).rejects.toMatchObject({ code: '23514' });
      expect(
        (await reader.query('SELECT versao_dados FROM mercado.versoes_dados ORDER BY versao_dados'))
          .rows,
      ).toEqual([{ versao_dados: 'publicada' }]);
    } finally {
      reader.release();
    }
  } finally {
    try {
      await writer.query('ROLLBACK');
    } finally {
      writer.release();
    }
  }
});
