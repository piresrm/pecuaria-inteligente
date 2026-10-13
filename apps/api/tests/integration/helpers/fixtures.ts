import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type pg from 'pg';
import manifesto from '../../../../../data/demonstrativa/v0.1/manifesto.json' with { type: 'json' };
import perfis from '../../../../../data/demonstrativa/v0.1/perfis.json' with { type: 'json' };
import regioes from '../../../../../data/demonstrativa/v0.1/regioes.json' with { type: 'json' };

export const originalManifest = manifesto;
export function manifestFor(id: string) {
  return { ...structuredClone(manifesto), versaoDados: id, conjuntoId: id };
}
export type Manifest = ReturnType<typeof manifestFor>;
export const hash = createHash('sha256')
  .update(
    readFileSync(new URL('../../../../../data/demonstrativa/v0.1/SHA256SUMS', import.meta.url)),
  )
  .digest('hex');
export async function insertVersion(client: pg.PoolClient, id: string, m = manifestFor(id)) {
  await client.query(
    `INSERT INTO mercado.versoes_dados (versao_dados, conjunto_id, versao_formato_arquivos, natureza, versao_territorial, preparado_em, janela_inicio, janela_fim, primeira_semana, ultima_semana, semana_anterior, hash_conjunto_sha256, manifesto, estado)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'preparacao')`,
    [
      id,
      m.conjuntoId,
      m.versaoFormatoArquivos,
      m.natureza,
      m.versaoTerritorial,
      m.preparadoEm,
      m.janela.inicio,
      m.janela.fim,
      m.janela.primeiraSemana,
      m.janela.ultimaSemana,
      m.janela.semanaAnterior,
      hash,
      JSON.stringify(m),
    ],
  );
}
export async function insertCatalog(
  client: pg.PoolClient,
  id: string,
  options: {
    omitRegion?: string;
    omitProfile?: string;
    omitMunicipalities?: boolean;
    noCondition?: boolean;
    reference?: string;
  } = {},
) {
  for (const p of perfis.filter((p) => p.id !== options.omitProfile)) {
    await client.query('INSERT INTO mercado.perfis VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [
      id,
      p.id,
      p.ordem,
      p.categoria,
      p.sexo,
      p.grupoRacial,
      p.idadeReferenciaMeses,
      p.pesoReferencia,
      p.unidadePeso,
      options.reference ?? p.referenciaParametrosId,
    ]);
  }
  for (const r of regioes.filter((r) => r.id !== options.omitRegion)) {
    await client.query('INSERT INTO mercado.regioes VALUES ($1,$2,$3,$4,$5,$6,$7)', [
      id,
      r.id,
      r.ordem,
      r.codigoImb,
      r.nome,
      r.nomeFonteImb,
      r.folhaFonteImb,
    ]);
    if (!options.omitMunicipalities)
      for (const m of r.municipios) {
        await client.query('INSERT INTO mercado.municipios VALUES ($1,$2,$3,$4,$5,$6)', [
          id,
          m.codigoIbge,
          r.id,
          m.nome,
          m.nomeFonte,
          m.linhaFonte,
        ]);
      }
  }
  if (!options.noCondition)
    for (const c of manifesto.condicoesComerciais)
      await client.query('INSERT INTO mercado.condicoes_comerciais VALUES ($1,$2,$3,$4,$5,$6)', [
        id,
        c.id,
        c.pagamento,
        c.frete,
        c.tributos,
        c.descricao,
      ]);
}
export async function insertPrices(client: pg.PoolClient, id: string, limit?: number) {
  const lines = readFileSync(
    new URL('../../../../../data/demonstrativa/v0.1/precos.csv', import.meta.url),
    'utf8',
  )
    .trimEnd()
    .split('\n')
    .slice(1);
  const rows = lines.slice(0, limit).map((line) => {
    const [perfilId, regiaoId, semana, preco, moeda, unidadePreco, natureza, , condicoesId] =
      line.split(',');
    return { perfilId, regiaoId, semana, preco, moeda, unidadePreco, natureza, condicoesId };
  });
  await client.query(
    `INSERT INTO mercado.precos SELECT $1, "perfilId", semana, "regiaoId", "condicoesId", preco, moeda, "unidadePreco", natureza
   FROM jsonb_to_recordset($2::jsonb) AS p("perfilId" text, "regiaoId" text, semana date, preco numeric, moeda text, "unidadePreco" text, natureza text, "condicoesId" text)`,
    [id, JSON.stringify(rows)],
  );
}
export async function loadFixture(client: pg.PoolClient, id: string, m = manifestFor(id)) {
  await insertVersion(client, id, m);
  await insertCatalog(client, id);
  await insertPrices(client, id);
}
export async function finalize(client: pg.PoolClient, id: string) {
  await client.query(
    "UPDATE mercado.versoes_dados SET estado = 'publicada' WHERE versao_dados = $1",
    [id],
  );
}
export async function publishFixture(client: pg.PoolClient, id: string) {
  await client.query('BEGIN');
  try {
    await client.query('SELECT id FROM mercado.publicacao_atual WHERE id = 1 FOR UPDATE');
    await loadFixture(client, id);
    await finalize(client, id);
    await client.query('UPDATE mercado.publicacao_atual SET versao_dados = $1 WHERE id = 1', [id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
export async function rollbackCase(
  pool: pg.Pool,
  run: (client: pg.PoolClient, id: string) => Promise<void>,
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await run(client, 'rascunho');
  } finally {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }
}
