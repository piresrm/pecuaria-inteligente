import type { EventEmitter } from 'node:events';
import type { FastifyInstance, FastifyListenOptions } from 'fastify';
import { buildApp, type AppDependencies } from './app.js';
import type { ServerConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { abrirConexaoInicial } from './db/startup.js';
import { createRepository } from './db/repository.js';
import { IpQuota } from './control/ip-quota.js';
import { EntryControl } from './control/entry-control.js';
import { DatabaseAdmission } from './control/database-admission.js';
import { ControlMetrics } from './control/metrics.js';
export interface ServerLifecycle {
  closeDatabase: () => Promise<void>;
  signals: EventEmitter;
}
/** Resource ownership is explicit. SIGTERM/SIGINT and failed initialization use
 * the same idempotent close path; Fastify drains before the pool is ended. */
export async function iniciarServidor(
  deps: AppDependencies,
  options: FastifyListenOptions,
  lifecycle?: ServerLifecycle,
): Promise<FastifyInstance> {
  let app: FastifyInstance | undefined;
  let databaseClosing: Promise<void> | undefined;
  const closeDatabase = () =>
    (databaseClosing ??= Promise.resolve().then(() => lifecycle?.closeDatabase()));
  const signal = () => {
    void app?.close().catch(() => {
      process.exitCode = 1;
    });
  };
  const detach = () => {
    lifecycle?.signals.removeListener('SIGTERM', signal);
    lifecycle?.signals.removeListener('SIGINT', signal);
  };
  try {
    app = await buildApp(deps, {
      onClose: async () => {
        detach();
        await closeDatabase();
      },
    });
    lifecycle?.signals.on('SIGTERM', signal);
    lifecycle?.signals.on('SIGINT', signal);
    await app.listen(options);
    return app;
  } catch (error) {
    detach();
    try {
      await app?.close();
    } finally {
      await closeDatabase();
    }
    throw error;
  }
}
/** Executable consumer always creates concrete controls and the read-only pool.
 * Startup checks connectivity but never migrates or publishes demonstration data. */
export async function iniciarAplicacao(
  config: ServerConfig,
  signals: EventEmitter = process,
): Promise<{ app: FastifyInstance; metrics: ControlMetrics }> {
  const handle = createDatabase(config.database);
  const metrics = new ControlMetrics();
  let ownershipTransferred = false;
  let startupCancelled = false;
  const cancelStartup = () => {
    startupCancelled = true;
  };
  // Guard the initial connection too: a signal must not be lost before Fastify
  // installs its lifecycle. Await the real query before ending its pool.
  signals.on('SIGTERM', cancelStartup);
  signals.on('SIGINT', cancelStartup);
  try {
    const banco = new DatabaseAdmission(
      metrics,
      () => performance.now(),
      config.databaseConcurrency,
    );
    const entrada = new EntryControl(
      new IpQuota({ capacity: config.quotaCapacity, refillPerSecond: config.quotaRefillPerSecond }),
      config.trustedProxies,
      metrics,
    );
    await banco.run(async () => {
      await abrirConexaoInicial(handle.pool, () => startupCancelled);
    });
    if (startupCancelled) throw new Error('Inicialização cancelada');
    ownershipTransferred = true;
    const app = await iniciarServidor(
      { repository: createRepository(handle), entrada, banco },
      { host: config.host, port: config.port },
      { closeDatabase: () => handle.close(), signals },
    );
    if (startupCancelled) {
      await app.close();
      throw new Error('Inicialização cancelada');
    }
    return { app, metrics };
  } catch (error) {
    if (!ownershipTransferred) await handle.close();
    throw error;
  } finally {
    signals.removeListener('SIGTERM', cancelStartup);
    signals.removeListener('SIGINT', cancelStartup);
  }
}
