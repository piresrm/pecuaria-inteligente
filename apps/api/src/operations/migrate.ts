import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { DatabaseConfig } from '../config.js';
import { createDatabase } from '../db/client.js';
import { abrirConexaoInicial } from '../db/startup.js';

export async function migrateDatabase(config: DatabaseConfig): Promise<void> {
  const database = createDatabase(config);
  try {
    await abrirConexaoInicial(database.pool);
    await migrate(database.db, {
      migrationsFolder: fileURLToPath(new URL('../../drizzle/', import.meta.url)),
    });
  } finally {
    await database.close();
  }
}
