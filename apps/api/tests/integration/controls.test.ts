import { mkdir, writeFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { startDatabase, type TestDatabase } from './helpers/database.js';
import { validarBase } from '../../src/demo/validate.js';
import { publicarBase } from '../../src/db/publication.js';
import { originalDirectory } from '../helpers/demo-files.js';
import { iniciarAplicacao } from '../../src/server.js';
import { serverConfigFromEnvironment } from '../../src/config.js';
import { resumoUrl, historicoUrl, profileId, versionId } from '../helpers/http.js';
import { DatabaseAdmission } from '../../src/control/database-admission.js';
import { ControlMetrics } from '../../src/control/metrics.js';
let database: TestDatabase;
beforeAll(async () => {
  database = await startDatabase();
  await publicarBase(database.handles.publicador, await validarBase(originalDirectory), 'inicial');
});
afterAll(async () => {
  await database?.close();
});
test('dez clientes compartilham IP em porta HTTP e PostgreSQL reais; registra bloqueios legítimos', async () => {
  const db = database.configs.consulta;
  const config = serverConfigFromEnvironment({
    NODE_ENV: 'production',
    DB_HOST: db.host,
    DB_PORT: String(db.port),
    DB_NAME: db.database,
    DB_USER: db.user,
    DB_PASSWORD_FILE: db.passwordFile,
    API_HOST: '127.0.0.1',
    API_PORT: '3000',
    API_PROXY_MODE: 'trusted',
    API_TRUSTED_PROXIES: '127.0.0.1',
  });
  const signals = new EventEmitter();
  const { app, metrics } = await iniciarAplicacao({ ...config, port: 0 }, signals);
  const origin = app.listeningOrigin;
  const begun = performance.now();
  const statuses: number[] = [];
  const etags = new Map<number, string>();
  const request = async (client: number, url: string, conditional = false) => {
    const response = await fetch(`${origin}${url}`, {
      headers: {
        'x-forwarded-for': client % 2 ? '::ffff:192.0.2.10' : '192.0.2.10',
        ...(conditional ? { 'if-none-match': etags.get(client)! } : {}),
      },
    });
    statuses.push(response.status);
    if (response.status === 200 && url === resumoUrl)
      etags.set(client, response.headers.get('etag')!);
    if (response.status === 429) {
      expect(response.headers.get('retry-after')).toBe('1');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(await response.json()).toMatchObject({ erro: { codigo: 'LIMITE_REQUISICOES' } });
    } else {
      await response.arrayBuffer();
    }
  };
  try {
    const clients = Array.from({ length: 10 }, (_, index) => index);
    // Open page, open initial history, change filter/profile, automatic revalidation.
    await Promise.all(clients.map((client) => request(client, resumoUrl)));
    await Promise.all(
      clients.map((client) =>
        request(client, `${historicoUrl}?perfilId=${profileId}&versaoDados=${versionId}`),
      ),
    );
    await Promise.all(
      clients.map((client) =>
        request(client, `${historicoUrl}?perfilId=garrote-macho-nelore&versaoDados=${versionId}`),
      ),
    );
    await Promise.all(clients.map((client) => request(client, resumoUrl, true)));
    const durationMs = performance.now() - begun;
    const admitted = statuses.filter((status) => status !== 429).length;
    const blocked = statuses.filter((status) => status === 429).length;
    expect(statuses).toHaveLength(40);
    expect(blocked).toBeGreaterThan(0);
    expect(admitted).toBeGreaterThanOrEqual(30);
    expect(admitted).toBeLessThanOrEqual(30 + Math.floor((durationMs * 2) / 1000));
    expect(statuses.every((status) => [200, 304, 429].includes(status))).toBe(true);
    expect(metrics.snapshot().entrada).toEqual({
      admitidas: admitted,
      recusadas: blocked,
      indisponiveis: 0,
    });
    const evidence = {
      requests: 40,
      admitted,
      blocked,
      durationMs: Math.round(durationMs),
      statuses,
      metrics: metrics.snapshot(),
    };
    const directory = new URL('../../../../artifacts/t6/', import.meta.url);
    await mkdir(directory, { recursive: true });
    await writeFile(new URL('load.json', directory), JSON.stringify(evidence, null, 2));
    console.info('T6 dez clientes:', JSON.stringify(evidence));
    signals.emit('SIGTERM');
    await app.close();
    expect(signals.listenerCount('SIGTERM')).toBe(0);
    await expect(fetch(`${origin}${resumoUrl}`)).rejects.toThrow();
  } finally {
    await app.close();
  }
});
test('admissão real recusa operação21 e recupera as vinte vagas após PostgreSQL concluir', async () => {
  const metrics = new ControlMetrics();
  const admission = new DatabaseAdmission(metrics);
  const operations = Array.from({ length: 20 }, () =>
    admission.run(async () => {
      const result = await database.handles.consulta.pool.query(
        'SELECT pg_sleep(0.1), 42 AS result',
      );
      return result.rows[0] as unknown;
    }),
  );
  try {
    await expect(
      admission.run(async () => {
        await database.handles.consulta.pool.query('SELECT 1');
      }),
    ).rejects.toThrow('SERVICO_OCUPADO');
  } finally {
    await Promise.all(operations);
  }
  expect(
    await admission.run(async () => {
      const result = await database.handles.consulta.pool.query('SELECT 42 AS result');
      return result.rows[0] as unknown;
    }),
  ).toEqual({ result: 42 });
  expect(metrics.snapshot().banco).toEqual({ admitidas: 21, recusadas: 1, ativas: 0, pico: 20 });
});

test('sinal durante conexão inicial impede abertura tardia e encerra recursos', async () => {
  const db = database.configs.consulta;
  const config = serverConfigFromEnvironment({
    NODE_ENV: 'production',
    DB_HOST: db.host,
    DB_PORT: String(db.port),
    DB_NAME: db.database,
    DB_USER: db.user,
    DB_PASSWORD_FILE: db.passwordFile,
    API_HOST: '127.0.0.1',
    API_PORT: '3000',
    API_PROXY_MODE: 'trusted',
    API_TRUSTED_PROXIES: '127.0.0.1',
  });
  const signals = new EventEmitter();
  let running: Awaited<ReturnType<typeof iniciarAplicacao>> | undefined;
  const startup = iniciarAplicacao({ ...config, port: 0 }, signals).then((value) => {
    running = value;
    return value;
  });
  signals.emit('SIGTERM');
  try {
    const outcome = await startup.then(
      () => 'started',
      (error: unknown) => String(error),
    );
    expect(outcome).toContain('Inicialização cancelada');
    expect(signals.listenerCount('SIGTERM')).toBe(0);
    expect(signals.listenerCount('SIGINT')).toBe(0);
  } finally {
    await running?.app.close();
  }
});
