import { sql, type SQL } from 'drizzle-orm';
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

export const mercado = pgSchema('mercado');
const identifier = (column: AnyPgColumn): SQL =>
  sql`${column} ~ '^[a-z0-9]([a-z0-9-]{0,78}[a-z0-9])?$'`;
const finiteDate = (column: AnyPgColumn): SQL => sql`isfinite(${column})`;
const monday = (column: AnyPgColumn): SQL =>
  sql`isfinite(${column}) AND extract(isodow FROM ${column}) = 1`;
const positive = (column: AnyPgColumn): SQL =>
  sql`${column} > 0 AND ${column} NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)`;
const nonempty = (column: AnyPgColumn, size: number): SQL =>
  sql`length(btrim(${column})) > 0 AND length(${column}) <= ${sql.raw(String(size))}`;

export const versoesDados = mercado.table(
  'versoes_dados',
  {
    versaoDados: text('versao_dados').primaryKey(),
    conjuntoId: text('conjunto_id').notNull(),
    versaoFormatoArquivos: text('versao_formato_arquivos').notNull(),
    natureza: text('natureza').notNull(),
    versaoTerritorial: text('versao_territorial').notNull(),
    preparadoEm: date('preparado_em', { mode: 'string' }).notNull(),
    janelaInicio: date('janela_inicio', { mode: 'string' }).notNull(),
    janelaFim: date('janela_fim', { mode: 'string' }).notNull(),
    primeiraSemana: date('primeira_semana', { mode: 'string' }).notNull(),
    ultimaSemana: date('ultima_semana', { mode: 'string' }).notNull(),
    semanaAnterior: date('semana_anterior', { mode: 'string' }).notNull(),
    hashConjuntoSha256: text('hash_conjunto_sha256').notNull(),
    manifesto: jsonb('manifesto').$type<Record<string, unknown>>().notNull(),
    estado: text('estado').notNull(),
    publicadoEm: timestamp('publicado_em', { withTimezone: true, precision: 3, mode: 'date' }),
  },
  (t) => [
    check('versao_identificador', identifier(t.versaoDados)),
    check('conjunto_identificador', identifier(t.conjuntoId)),
    check('territorio_identificador', identifier(t.versaoTerritorial)),
    check('versao_formato', sql`${t.versaoFormatoArquivos} = '1'`),
    check('versao_natureza', sql`${t.natureza} = 'demonstrativa'`),
    check('preparado_finito', finiteDate(t.preparadoEm)),
    check(
      'janela_civil',
      sql`${finiteDate(t.janelaInicio)} AND ${finiteDate(t.janelaFim)} AND extract(day FROM ${t.janelaInicio}) = 1 AND ${t.janelaFim} = (${t.janelaInicio} + interval '1 year' - interval '1 day')::date`,
    ),
    check(
      'calendario_semanal',
      sql`${monday(t.primeiraSemana)} AND ${monday(t.ultimaSemana)} AND ${monday(t.semanaAnterior)} AND ${t.primeiraSemana} BETWEEN ${t.janelaInicio} AND ${t.janelaInicio} + 6 AND ${t.ultimaSemana} BETWEEN ${t.janelaFim} - 6 AND ${t.janelaFim} AND ${t.semanaAnterior} = ${t.primeiraSemana} - 7`,
    ),
    check('hash_sha256', sql`${t.hashConjuntoSha256} ~ '^[0-9a-f]{64}$'`),
    check('manifesto_objeto', sql`jsonb_typeof(${t.manifesto}) = 'object'`),
    check(
      'estado_publicacao',
      sql`(${t.estado} = 'preparacao' AND ${t.publicadoEm} IS NULL) OR (${t.estado} = 'publicada' AND ${t.publicadoEm} IS NOT NULL AND isfinite(${t.publicadoEm}))`,
    ),
  ],
);
const version = () =>
  text('versao_dados')
    .notNull()
    .references(() => versoesDados.versaoDados, { onUpdate: 'no action', onDelete: 'no action' });
export const perfis = mercado.table(
  'perfis',
  {
    versaoDados: version(),
    perfilId: text('perfil_id').notNull(),
    ordem: smallint('ordem').notNull(),
    categoria: text('categoria').notNull(),
    sexo: text('sexo').notNull(),
    grupoRacial: text('grupo_racial').notNull(),
    idadeReferenciaMeses: smallint('idade_referencia_meses').notNull(),
    pesoReferencia: numeric('peso_referencia', { precision: 8, scale: 2 }).notNull(),
    unidadePeso: text('unidade_peso').notNull(),
    referenciaParametrosId: text('referencia_parametros_id').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.versaoDados, t.perfilId] }),
    unique('perfis_ordem').on(t.versaoDados, t.ordem),
    unique('perfis_combinacao').on(t.versaoDados, t.categoria, t.sexo, t.grupoRacial),
    check('perfil_identificador', identifier(t.perfilId)),
    check('referencia_identificador', identifier(t.referenciaParametrosId)),
    check('perfil_ordem', sql`${t.ordem} BETWEEN 1 AND 8`),
    check(
      'perfil_coerencia',
      sql`(${t.categoria} IN ('Bezerro','Garrote') AND ${t.sexo} = 'Macho' AND ${t.grupoRacial} IN ('Nelore','Mestiço')) OR (${t.categoria} IN ('Bezerra','Novilha') AND ${t.sexo} = 'Fêmea' AND ${t.grupoRacial} IN ('Nelore','Mestiça'))`,
    ),
    check('perfil_idade', sql`${t.idadeReferenciaMeses} > 0`),
    check('perfil_peso', positive(t.pesoReferencia)),
    check('perfil_unidade', sql`${t.unidadePeso} = 'kg'`),
  ],
);
export const regioes = mercado.table(
  'regioes',
  {
    versaoDados: version(),
    regiaoId: text('regiao_id').notNull(),
    ordem: smallint('ordem').notNull(),
    codigoImb: text('codigo_imb').notNull(),
    nome: text('nome').notNull(),
    nomeFonteImb: text('nome_fonte_imb').notNull(),
    folhaFonteImb: text('folha_fonte_imb').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.versaoDados, t.regiaoId] }),
    unique('regioes_ordem').on(t.versaoDados, t.ordem),
    unique('regioes_codigo').on(t.versaoDados, t.codigoImb),
    check('regiao_identificador', identifier(t.regiaoId)),
    check('regiao_ordem', sql`${t.ordem} BETWEEN 1 AND 10`),
    check('regiao_codigo', sql`${t.codigoImb} ~ '^(00[1-9]|010)$'`),
    check('regiao_nome', nonempty(t.nome, 160)),
    check('regiao_nome_fonte', nonempty(t.nomeFonteImb, 160)),
    check('regiao_folha', nonempty(t.folhaFonteImb, 80)),
  ],
);
export const municipios = mercado.table(
  'municipios',
  {
    versaoDados: version(),
    codigoIbge: text('codigo_ibge').notNull(),
    regiaoId: text('regiao_id').notNull(),
    nome: text('nome').notNull(),
    nomeFonteImb: text('nome_fonte_imb').notNull(),
    linhaFonteImb: integer('linha_fonte_imb').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.versaoDados, t.codigoIbge] }),
    foreignKey({
      columns: [t.versaoDados, t.regiaoId],
      foreignColumns: [regioes.versaoDados, regioes.regiaoId],
    })
      .onUpdate('no action')
      .onDelete('no action'),
    index('municipios_composicao').on(t.versaoDados, t.regiaoId, t.codigoIbge),
    check('municipio_codigo', sql`${t.codigoIbge} ~ '^52[0-9]{5}$'`),
    check('municipio_nome', nonempty(t.nome, 160)),
    check('municipio_nome_fonte', nonempty(t.nomeFonteImb, 160)),
    check('municipio_linha', sql`${t.linhaFonteImb} > 0`),
  ],
);
export const condicoesComerciais = mercado.table(
  'condicoes_comerciais',
  {
    versaoDados: version(),
    condicoesId: text('condicoes_id').notNull(),
    pagamento: text('pagamento').notNull(),
    frete: text('frete').notNull(),
    tributos: text('tributos').notNull(),
    descricao: text('descricao').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.versaoDados, t.condicoesId] }),
    check('condicao_identificador', identifier(t.condicoesId)),
    check('condicao_pagamento', sql`${t.pagamento} = 'à vista'`),
    check('condicao_frete', sql`${t.frete} = 'excluído'`),
    check('condicao_tributos', sql`${t.tributos} = 'excluídos'`),
    check('condicao_descricao', nonempty(t.descricao, 512)),
  ],
);
export const precos = mercado.table(
  'precos',
  {
    versaoDados: version(),
    perfilId: text('perfil_id').notNull(),
    semana: date('semana', { mode: 'string' }).notNull(),
    regiaoId: text('regiao_id').notNull(),
    condicoesId: text('condicoes_id').notNull(),
    preco: numeric('preco', { precision: 12, scale: 2 }).notNull(),
    moeda: text('moeda').notNull(),
    unidadePreco: text('unidade_preco').notNull(),
    natureza: text('natureza').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.versaoDados, t.perfilId, t.semana, t.regiaoId] }),
    foreignKey({
      columns: [t.versaoDados, t.perfilId],
      foreignColumns: [perfis.versaoDados, perfis.perfilId],
    })
      .onUpdate('no action')
      .onDelete('no action'),
    foreignKey({
      columns: [t.versaoDados, t.regiaoId],
      foreignColumns: [regioes.versaoDados, regioes.regiaoId],
    })
      .onUpdate('no action')
      .onDelete('no action'),
    foreignKey({
      columns: [t.versaoDados, t.condicoesId],
      foreignColumns: [condicoesComerciais.versaoDados, condicoesComerciais.condicoesId],
    })
      .onUpdate('no action')
      .onDelete('no action'),
    index('precos_resumo').on(t.versaoDados, t.semana, t.perfilId, t.regiaoId),
    check('preco_semana', monday(t.semana)),
    check('preco_positivo', positive(t.preco)),
    check('preco_moeda', sql`${t.moeda} = 'BRL'`),
    check('preco_unidade', sql`${t.unidadePreco} = 'cabeca'`),
    check('preco_natureza', sql`${t.natureza} = 'demonstrativa'`),
  ],
);
export const publicacaoAtual = mercado.table(
  'publicacao_atual',
  {
    id: smallint('id').primaryKey(),
    versaoDados: text('versao_dados').references(() => versoesDados.versaoDados, {
      onUpdate: 'no action',
      onDelete: 'no action',
    }),
  },
  (t) => [check('publicacao_unica', sql`${t.id} = 1`)],
);
