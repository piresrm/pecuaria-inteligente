import { afterAll, beforeAll, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import { startDatabase, type TestDatabase } from './helpers/database.js';
import {
  finalize,
  insertCatalog,
  insertPrices,
  insertVersion,
  loadFixture,
  manifestFor,
  publishFixture,
  rollbackCase,
} from './helpers/fixtures.js';
import { migrateDatabase } from '../../src/operations/migrate.js';
import { perfis, precos, versoesDados } from '../../src/db/schema.js';

let database: TestDatabase;
beforeAll(async () => {
  database = await startDatabase();
});
afterAll(async () => {
  await database?.close();
});

test('cria as sete tabelas do esquema mercado numa base vazia', async () => {
  const result = await database.handles.migracao.pool.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'mercado'",
  );
  expect(result.rows[0]?.count).toBe(7);
});
test('mantém uma referência única nula ao reaplicar todo o histórico', async () => {
  await migrateDatabase(database.configs.migracao);
  const result = await database.handles.consulta.pool.query(
    'SELECT * FROM mercado.publicacao_atual',
  );
  expect(result.rows).toEqual([{ id: 1, versao_dados: null }]);
});
test('não permite preparação persistida ao confirmar a transação', async () => {
  await rollbackCase(database.handles.migracao.pool, async (client, id) => {
    await insertVersion(client, id);
    await expect(client.query('COMMIT')).rejects.toMatchObject({ code: '23514' });
  });
  const result = await database.handles.migracao.pool.query('SELECT * FROM mercado.versoes_dados');
  expect(result.rows).toEqual([]);
});
test('mantém a restrição de finalização inicialmente adiada', async () => {
  await rollbackCase(database.handles.migracao.pool, async (client, id) => {
    await insertVersion(client, id);
    await expect(client.query('SET CONSTRAINTS ALL IMMEDIATE')).rejects.toMatchObject({
      code: '23514',
    });
  });
});
test('preserva numeric textual, datas civis e instante UTC com três casas na carga completa', async () => {
  const client = await database.handles.publicador.pool.connect();
  try {
    await publishFixture(client, 'publicada');
  } finally {
    client.release();
  }
  const db = database.handles.consulta.db;
  const [profile] = await db
    .select({ peso: perfis.pesoReferencia })
    .from(perfis)
    .where(eq(perfis.perfilId, 'bezerro-macho-nelore'));
  const [price] = await db
    .select()
    .from(precos)
    .where(eq(precos.semana, '2025-09-29'))
    .orderBy(precos.regiaoId);
  const [version] = await db
    .select()
    .from(versoesDados)
    .where(eq(versoesDados.versaoDados, 'publicada'));
  expect(profile?.peso).toBe('240.00');
  expect(typeof price?.preco).toBe('string');
  expect(price?.semana).toBe('2025-09-29');
  expect(version?.preparadoEm).toBe('2026-10-07');
  expect(version?.publicadoEm?.toISOString()).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  );
  const counts = await database.handles.consulta.pool.query<{
    perfis: number;
    regioes: number;
    municipios: number;
    precos: number;
  }>(
    'SELECT (SELECT count(*)::int FROM mercado.perfis) AS perfis, (SELECT count(*)::int FROM mercado.regioes) AS regioes, (SELECT count(*)::int FROM mercado.municipios) AS municipios, (SELECT count(*)::int FROM mercado.precos) AS precos',
  );
  expect(counts.rows[0]).toEqual({ perfis: 8, regioes: 10, municipios: 246, precos: 4146 });
});
test('aceita calendário civil com 53 segundas-feiras sem fixar 52', async () => {
  await rollbackCase(database.handles.publicador.pool, async (client, id) => {
    const m = manifestFor(id);
    m.janela = {
      ...m.janela,
      inicio: '2023-05-01',
      fim: '2024-04-30',
      primeiraSemana: '2023-05-01',
      ultimaSemana: '2024-04-29',
      semanaAnterior: '2023-04-24',
      quantidadeSemanasNaJanela: 53,
      quantidadeSemanasComAnterior: 54,
    };
    m.contagens = {
      ...m.contagens,
      precos: 1,
      precosNaJanela: 1,
      precosSemanaAnterior: 0,
      combinacoesPossiveis: 4320,
      lacunas: 4319,
    };
    await insertVersion(client, id, m);
    await insertCatalog(client, id);
    await client.query(
      "INSERT INTO mercado.precos VALUES ($1,'bezerro-macho-nelore','2023-05-01','metropolitana-goiania','avista-sem-frete-sem-tributos','1.01','BRL','cabeca','demonstrativa')",
      [id],
    );
    await finalize(client, id);
    expect(
      (
        await client.query<{ estado: string }>(
          'SELECT estado FROM mercado.versoes_dados WHERE versao_dados=$1',
          [id],
        )
      ).rows[0]?.estado,
    ).toBe('publicada');
  });
});
test('instala PKs/FKs compostas e índices para histórico, resumo e território', async () => {
  const { rows } = await database.handles.consulta.pool.query<{
    indexname: string;
    indexdef: string;
  }>("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='mercado'");
  expect(rows.find((r) => r.indexname === 'precos_resumo')?.indexdef).toContain(
    '(versao_dados, semana, perfil_id, regiao_id)',
  );
  expect(rows.find((r) => r.indexname === 'municipios_composicao')?.indexdef).toContain(
    '(versao_dados, regiao_id, codigo_ibge)',
  );
  expect(
    rows.find((r) => r.indexname === 'precos_versao_dados_perfil_id_semana_regiao_id_pk')?.indexdef,
  ).toContain('(versao_dados, perfil_id, semana, regiao_id)');
  const fks = await database.handles.consulta.pool.query<{
    confdeltype: string;
    confupdtype: string;
  }>(
    "SELECT confdeltype,confupdtype FROM pg_constraint WHERE contype='f' AND connamespace='mercado'::regnamespace",
  );
  expect(fks.rows).toHaveLength(10);
  expect(fks.rows.every((r) => r.confdeltype === 'a' && r.confupdtype === 'a')).toBe(true);
});
test.each(['0.00', '-1.00', 'NaN', 'Infinity', '-Infinity', '10000000000.00', null])(
  'rejeita preço inválido %s',
  async (price) => {
    await rollbackCase(database.handles.publicador.pool, async (client, id) => {
      await insertVersion(client, id);
      await insertCatalog(client, id);
      await expect(
        client.query(
          "INSERT INTO mercado.precos VALUES ($1,'bezerro-macho-nelore','2025-10-06','metropolitana-goiania','avista-sem-frete-sem-tributos',$2,'BRL','cabeca','demonstrativa')",
          [id, price],
        ),
      ).rejects.toMatchObject({ code: expect.stringMatching(/^(23514|22003|23502)$/) as unknown });
    });
  },
);
test.each(['0.00', '-1.00', 'NaN', 'Infinity', '-Infinity', '1000000.00', null])(
  'rejeita peso inválido %s',
  async (weight) => {
    await rollbackCase(database.handles.publicador.pool, async (client, id) => {
      await insertVersion(client, id);
      await expect(
        client.query(
          "INSERT INTO mercado.perfis VALUES ($1,'perfil',1,'Bezerro','Macho','Nelore',12,$2,'kg','scot-reposicao')",
          [id, weight],
        ),
      ).rejects.toMatchObject({ code: expect.stringMatching(/^(23514|22003|23502)$/) as unknown });
    });
  },
);
test.each(['2025-10-07', '2025-09-22', '2026-10-05', 'infinity', '-infinity'])(
  'rejeita semana não finita, não semanal ou externa %s',
  async (week) => {
    await rollbackCase(database.handles.publicador.pool, async (client, id) => {
      await insertVersion(client, id);
      await insertCatalog(client, id);
      await expect(
        client.query(
          "INSERT INTO mercado.precos VALUES ($1,'bezerro-macho-nelore',$2,'metropolitana-goiania','avista-sem-frete-sem-tributos','1.00','BRL','cabeca','demonstrativa')",
          [id, week],
        ),
      ).rejects.toMatchObject({ code: expect.stringMatching(/^(23514|22003|23502)$/) as unknown });
    });
  },
);
test.each([
  ['USD', 'cabeca', 'demonstrativa'],
  ['BRL', 'kg', 'demonstrativa'],
  ['BRL', 'cabeca', 'observada'],
])('rejeita moeda/unidade/natureza %s %s %s', async (currency, unit, nature) => {
  await rollbackCase(database.handles.publicador.pool, async (client, id) => {
    await insertVersion(client, id);
    await insertCatalog(client, id);
    await expect(
      client.query(
        "INSERT INTO mercado.precos VALUES ($1,'bezerro-macho-nelore','2025-10-06','metropolitana-goiania','avista-sem-frete-sem-tributos','1.00',$2,$3,$4)",
        [id, currency, unit, nature],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
test('rejeita vínculo com perfil pertencente somente a outra versão', async () => {
  await rollbackCase(database.handles.publicador.pool, async (client, id) => {
    await insertVersion(client, id);
    await insertCatalog(client, id, { omitProfile: 'bezerro-macho-nelore' });
    await expect(
      client.query(
        "INSERT INTO mercado.precos VALUES ($1,'bezerro-macho-nelore','2025-10-06','metropolitana-goiania','avista-sem-frete-sem-tributos','1.00','BRL','cabeca','demonstrativa')",
        [id],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });
});
test('rejeita preço duplicado pela identidade composta', async () => {
  await rollbackCase(database.handles.publicador.pool, async (client, id) => {
    await loadFixture(client, id);
    await expect(insertPrices(client, id, 1)).rejects.toMatchObject({ code: '23505' });
  });
});
test.each(['precos', 'manifesto', 'referencias', 'municipios', 'perfil', 'regiao', 'condicao'])(
  'não finaliza conjunto incompleto ou incoerente: %s',
  async (failure) => {
    await rollbackCase(database.handles.publicador.pool, async (client, id) => {
      const m = manifestFor(id);
      if (failure === 'manifesto') m.janela.quantidadeSemanasNaJanela = 51;
      if (failure === 'referencias') m.referencias = [];
      await insertVersion(client, id, m);
      await insertCatalog(client, id, {
        ...(failure === 'municipios' ? { omitMunicipalities: true } : {}),
        ...(failure === 'perfil' ? { omitProfile: 'bezerro-macho-nelore' } : {}),
        ...(failure === 'regiao' ? { omitRegion: 'metropolitana-goiania' } : {}),
        ...(failure === 'condicao' ? { noCondition: true } : {}),
      });
      if (['manifesto', 'referencias'].includes(failure)) await insertPrices(client, id);
      await expect(finalize(client, id)).rejects.toMatchObject({ code: '23514' });
    });
  },
);
test('gera instante no servidor e recusa instante indicado pelo publicador', async () => {
  await rollbackCase(database.handles.publicador.pool, async (client, id) => {
    await loadFixture(client, id);
    await expect(
      client.query(
        "UPDATE mercado.versoes_dados SET estado='publicada', publicado_em='2000-01-01T00:00:00Z' WHERE versao_dados=$1",
        [id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
});

test.each([
  ['janela_inicio', "'2025-10-02'"],
  ['janela_fim', "'2026-09-29'"],
  ['primeira_semana', "'2025-10-13'"],
  ['ultima_semana', "'2026-09-21'"],
  ['semana_anterior', "'2025-09-22'"],
  ['preparado_em', "'infinity'"],
  ['versao_dados', "'IDENTIFICADOR-INVALIDO'"],
  ['hash_conjunto_sha256', "'zz'"],
  ['manifesto', "'[]'::jsonb"],
])(
  'restrições declarativas rejeitam %s inválido antes de qualquer finalização',
  async (column, value) => {
    await rollbackCase(database.handles.migracao.pool, async (client, id) => {
      // INSERT is used because UPDATE is intentionally forbidden even in preparation.
      await insertVersion(client, id);
      const columns = await client.query<{ attname: string }>(
        "SELECT attname FROM pg_attribute WHERE attrelid='mercado.versoes_dados'::regclass AND attnum>0 AND NOT attisdropped ORDER BY attnum",
      );
      const projection = columns.rows
        .map(({ attname }) =>
          attname === 'versao_dados' && column !== 'versao_dados'
            ? "'nova'"
            : attname === column
              ? value
              : attname,
        )
        .join(',');
      await expect(
        client.query(
          `INSERT INTO mercado.versoes_dados SELECT ${projection} FROM mercado.versoes_dados WHERE versao_dados=$1`,
          [id],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
  },
);
test('protege metadados durante finalização mesmo sob proprietário', async () => {
  await rollbackCase(database.handles.migracao.pool, async (client, id) => {
    await loadFixture(client, id);
    await expect(
      client.query(
        "UPDATE mercado.versoes_dados SET estado='publicada', manifesto='{}' WHERE versao_dados=$1",
        [id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
test('rejeita versão inserida diretamente publicada ou com instante antecipado', async () => {
  await rollbackCase(database.handles.publicador.pool, async (client, id) => {
    await insertVersion(client, id);
    await expect(
      client.query(
        "INSERT INTO mercado.versoes_dados SELECT 'nova',conjunto_id,versao_formato_arquivos,natureza,versao_territorial,preparado_em,janela_inicio,janela_fim,primeira_semana,ultima_semana,semana_anterior,hash_conjunto_sha256,manifesto,'publicada',clock_timestamp() FROM mercado.versoes_dados WHERE versao_dados=$1",
        [id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });
});

test.each(['regiao', 'condicao', 'municipio'])(
  'rejeita referência cruzada de %s entre versões',
  async (kind) => {
    await rollbackCase(database.handles.publicador.pool, async (client, id) => {
      await insertVersion(client, id);
      if (kind === 'municipio') {
        await expect(
          client.query(
            "INSERT INTO mercado.municipios VALUES ($1,'5200050','metropolitana-goiania','Abadia de Goiás','Abadia de Goiás',7)",
            [id],
          ),
        ).rejects.toMatchObject({ code: '23503' });
      } else {
        await insertCatalog(
          client,
          id,
          kind === 'regiao' ? { omitRegion: 'metropolitana-goiania' } : { noCondition: true },
        );
        await expect(
          client.query(
            "INSERT INTO mercado.precos VALUES ($1,'bezerro-macho-nelore','2025-10-06','metropolitana-goiania','avista-sem-frete-sem-tributos','1.00','BRL','cabeca','demonstrativa')",
            [id],
          ),
        ).rejects.toMatchObject({ code: '23503' });
      }
    });
  },
);
test('exige município em cada região mesmo com total correspondente ao manifesto', async () => {
  await rollbackCase(database.handles.publicador.pool, async (client, id) => {
    const m = manifestFor(id);
    m.contagens.municipios = 1;
    await insertVersion(client, id, m);
    await insertCatalog(client, id, { omitMunicipalities: true });
    await client.query(
      "INSERT INTO mercado.municipios VALUES ($1,'5200050','metropolitana-goiania','Abadia de Goiás','Abadia de Goiás',7)",
      [id],
    );
    await insertPrices(client, id);
    await expect(finalize(client, id)).rejects.toMatchObject({ code: '23514' });
  });
});

test('mantém datas civis textuais também no SQL personalizado, preservando numeric e instantes', async () => {
  const client = await database.handles.consulta.pool.connect();
  try {
    await client.query("SET timezone = 'America/Sao_Paulo'");
    const { rows } = await client.query<{ civil: string; preco: string; instante: Date }>(
      "SELECT '2026-10-07'::date AS civil, '3417.59'::numeric(12,2) AS preco, '2026-10-07T12:00:00.123Z'::timestamptz(3) AS instante",
    );
    expect(rows[0]?.civil).toBe('2026-10-07');
    expect(rows[0]?.preco).toBe('3417.59');
    expect(rows[0]?.instante.toISOString()).toBe('2026-10-07T12:00:00.123Z');
  } finally {
    try {
      await client.query("SET timezone = 'UTC'");
    } finally {
      client.release();
    }
  }
});
