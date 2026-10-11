import { readFileSync } from 'node:fs';
import { publicarBase } from '../../../src/db/publication.js';
import type { BaseValidada } from '../../../src/demo/validate.js';
import type { TestDatabase } from './database.js';
// Independent CSV oracle: no recipe, domain, repository or projection helpers.
export const csvPrices = readFileSync(
  new URL('../../../../../data/demonstrativa/v0.1/precos.csv', import.meta.url),
  'utf8',
)
  .trimEnd()
  .split('\n')
  .slice(1)
  .map((line) => {
    const [
      perfilId,
      regiaoId,
      semana,
      preco,
      moeda,
      unidadePreco,
      natureza,
      conjuntoId,
      condicoesComerciaisId,
    ] = line.split(',');
    return {
      perfilId,
      regiaoId,
      semana,
      preco,
      moeda,
      unidadePreco,
      natureza,
      conjuntoId,
      condicoesComerciaisId,
    };
  });
// Hold the real publisher after insertion, before finalization/COMMIT. Reads use
// independent read-only connections; no intercepted query or repository double.
export async function duringPublication<T>(
  database: TestDatabase,
  base: BaseValidada,
  read: () => Promise<T>,
): Promise<T> {
  const blocker = await database.handles.migracao.pool.connect();
  let publication: ReturnType<typeof publicarBase> | undefined;
  await database.handles.migracao.pool.query(
    `CREATE FUNCTION mercado.pausa_consulta_teste() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(725105); RETURN NEW; END $$; CREATE TRIGGER pausa_consulta_teste BEFORE UPDATE ON mercado.versoes_dados FOR EACH ROW EXECUTE FUNCTION mercado.pausa_consulta_teste()`,
  );
  try {
    await blocker.query('SELECT pg_advisory_lock(725105)');
    publication = publicarBase(database.handles.publicador, base, 'explicito');
    const deadline = performance.now() + 5000;
    while (true) {
      const result = await blocker.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM pg_locks WHERE locktype='advisory' AND NOT granted",
      );
      if ((result.rows[0]?.count ?? 0) > 0) break;
      if (performance.now() >= deadline)
        throw new Error('Publicação não atingiu o bloqueio transacional de teste');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    const result = await read();
    await blocker.query('SELECT pg_advisory_unlock(725105)');
    await publication;
    return result;
  } finally {
    try {
      await blocker.query('SELECT pg_advisory_unlock(725105)');
    } finally {
      blocker.release();
    }
    if (publication) await Promise.allSettled([publication]);
    await database.handles.migracao.pool.query(
      'DROP TRIGGER pausa_consulta_teste ON mercado.versoes_dados; DROP FUNCTION mercado.pausa_consulta_teste()',
    );
  }
}
