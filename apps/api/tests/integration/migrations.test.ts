import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { startDatabase, type TestDatabase } from './helpers/database.js';
import { loadFixture } from './helpers/fixtures.js';
import { migrateDatabase } from '../../src/operations/migrate.js';

let database: TestDatabase;
beforeAll(async () => {
  database = await startDatabase(false);
});
afterAll(async () => {
  await database?.close();
});
test('evolui o histórico declarativo para proteções preservando versão e ponteiro anteriores', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pecuaria-migracoes-'));
  try {
    const source = new URL('../../drizzle/', import.meta.url);
    const journal = JSON.parse(await readFile(new URL('meta/_journal.json', source), 'utf8')) as {
      version: string;
      dialect: string;
      entries: unknown[];
    };
    await mkdir(join(directory, 'meta'));
    await writeFile(
      join(directory, 'meta/_journal.json'),
      JSON.stringify({ ...journal, entries: journal.entries.slice(0, 1) }),
    );
    await copyFile(
      new URL('0000_esquema_mercado.sql', source),
      join(directory, '0000_esquema_mercado.sql'),
    );
    await migrate(database.handles.migracao.db, { migrationsFolder: directory });
    // Simulate a publication under the earlier schema, before invoker triggers
    // exist. This is a migration evolution fixture, never a permission check.
    const client = await database.handles.migracao.pool.connect();
    try {
      await client.query('BEGIN');
      await loadFixture(client, 'anterior');
      await client.query(
        "UPDATE mercado.versoes_dados SET estado='publicada',publicado_em='2026-10-07T12:00:00.123Z' WHERE versao_dados='anterior'",
      );
      await client.query("INSERT INTO mercado.publicacao_atual VALUES(1,'anterior')");
      await client.query('COMMIT');
    } finally {
      try {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }
    }
    await migrateDatabase(database.configs.migracao);
    const config = database.configs.migracao;
    await promisify(execFile)(
      process.execPath,
      [
        '--import',
        'tsx',
        fileURLToPath(new URL('../../src/operations/migrate-cli.ts', import.meta.url)),
      ],
      {
        env: {
          ...process.env,
          DB_HOST: config.host,
          DB_PORT: String(config.port),
          DB_NAME: config.database,
          DB_USER: config.user,
          DB_PASSWORD_FILE: config.passwordFile,
        },
        timeout: 10000,
      },
    );
    const { rows } = await database.handles.consulta.pool.query<{
      versao_dados: string;
      publicado_em: Date;
      precos: number;
    }>(
      'SELECT v.versao_dados,v.publicado_em,(SELECT count(*)::int FROM mercado.precos) AS precos FROM mercado.versoes_dados v JOIN mercado.publicacao_atual a USING(versao_dados)',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.versao_dados).toBe('anterior');
    expect(rows[0]?.precos).toBe(4146);
    expect(rows[0]?.publicado_em.toISOString()).toBe('2026-10-07T12:00:00.123Z');
    await expect(
      database.handles.publicador.pool.query("UPDATE mercado.versoes_dados SET estado='publicada'"),
    ).rejects.toMatchObject({ code: '23514' });
    expect(
      (await database.handles.migracao.pool.query('SELECT * FROM drizzle.__drizzle_migrations'))
        .rows,
    ).toHaveLength(2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
