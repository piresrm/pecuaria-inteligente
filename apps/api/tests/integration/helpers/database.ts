import { randomBytes } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createDatabase, type DatabaseHandle } from '../../../src/db/client.js';
import { migrateDatabase } from '../../../src/operations/migrate.js';
import type { DatabaseConfig } from '../../../src/config.js';

export const postgresImage =
  'postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c';
export type Role = 'migracao' | 'publicador' | 'consulta';
export interface TestDatabase {
  configs: Record<Role, DatabaseConfig>;
  handles: Record<Role, DatabaseHandle>;
  close(): Promise<void>;
}
export async function startDatabase(applyMigrations = true): Promise<TestDatabase> {
  const start = performance.now();
  const directory = await mkdtemp(join(tmpdir(), 'pecuaria-banco-'));
  let container: StartedPostgreSqlContainer | undefined;
  const handles: DatabaseHandle[] = [];
  const close = async () => {
    try {
      const results = await Promise.allSettled(handles.map((handle) => handle.close()));
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length)
        throw new AggregateError(
          failures.map((result): unknown => result.reason),
          'Falha ao encerrar conexões de teste',
        );
    } finally {
      try {
        await container?.stop();
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    }
  };
  try {
    const roles: Role[] = ['migracao', 'publicador', 'consulta'];
    const secrets = roles.map((role) => ({
      role,
      value: randomBytes(24).toString('hex'),
      path: join(directory, role),
    }));
    for (const secret of secrets) await writeFile(secret.path, secret.value, { mode: 0o600 });
    container = await new PostgreSqlContainer(postgresImage)
      .withDatabase(`pi_test_${randomBytes(8).toString('hex')}`)
      .withUsername('bootstrap')
      .withPassword(randomBytes(24).toString('hex'))
      .withEnvironment({
        MIGRACAO_PASSWORD_FILE: '/run/migracao',
        PUBLICADOR_PASSWORD_FILE: '/run/publicador',
        CONSULTA_PASSWORD_FILE: '/run/consulta',
      })
      .withCopyFilesToContainer([
        {
          source: fileURLToPath(
            new URL('../../../../../infra/postgres/init-roles.sh', import.meta.url),
          ),
          target: '/docker-entrypoint-initdb.d/10-roles.sh',
        },
      ])
      .withCopyContentToContainer(
        secrets.map((s) => ({ content: s.value, target: `/run/${s.role}` })),
      )
      .withStartupTimeout(60000)
      .start();
    const running = container;
    const configs = Object.fromEntries(
      secrets.map((s) => [
        s.role,
        {
          host: running.getHost(),
          port: running.getPort(),
          database: running.getDatabase(),
          user: `mercado_${s.role}`,
          passwordFile: s.path,
        },
      ]),
    ) as Record<Role, DatabaseConfig>;
    const byRole = Object.fromEntries(
      roles.map((role) => {
        const handle = createDatabase(configs[role]);
        handles.push(handle);
        return [role, handle];
      }),
    ) as Record<Role, DatabaseHandle>;
    if (applyMigrations) await migrateDatabase(configs.migracao);
    const server = await byRole.migracao.pool.query<{ server_version: string }>(
      'SHOW server_version',
    );
    console.info(
      `Preparação PostgreSQL: ${Math.round(performance.now() - start)} ms; servidor ${server.rows[0]?.server_version}`,
    );
    return { configs, handles: byRole, close };
  } catch (error) {
    await close();
    throw error;
  }
}
