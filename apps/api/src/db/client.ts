import { readFileSync } from 'node:fs';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { DatabaseConfig } from '../config.js';
import * as schema from './schema.js';

export interface DatabaseHandle {
  db: NodePgDatabase<typeof schema>;
  pool: pg.Pool;
  close(): Promise<void>;
}

export function createDatabase(
  config: DatabaseConfig,
  reportIdleError: () => void = () => console.error('Conexão ociosa do banco interrompida'),
): DatabaseHandle {
  const password = readFileSync(config.passwordFile, 'utf8').replace(/\r?\n$/, '');
  if (!password) throw new Error('O arquivo de segredo do banco está vazio.');
  const pool = new pg.Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password,
    max: 20,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    options: '-c timezone=UTC',
    // Queries use pg's default text protocol. Keep civil dates as text per pool;
    // leave every other OID and binary format to pg (binary is not our contract).
    types: {
      getTypeParser(oid, format) {
        if (oid === pg.types.builtins.DATE && (format === undefined || format === 'text')) {
          return (value: string) => value;
        }
        const parser: unknown = pg.types.getTypeParser(oid, format);
        return parser;
      },
    },
  });
  // pg removes failed idle clients itself. Handle its error event so a later
  // request can report the public database error instead of crashing the process.
  // No SQL is retried and no credential or connection address is logged.
  pool.on('error', reportIdleError);
  return { db: drizzle(pool, { schema }), pool, close: () => pool.end() };
}
