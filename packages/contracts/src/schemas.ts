import { Type, type Static, type TSchema } from 'typebox';

// A referência preserva a inferência do alvo e o $ref documental Draft 7.
function ref<T extends TSchema>(name: string, target: T) {
  void target;
  return Type.Unsafe<Static<T>>(Type.Ref(`#/definitions/${name}`));
}

export const Identificador = Type.String({
  minLength: 1,
  maxLength: 80,
  pattern: '^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?(?![\\s\\S])',
});

export const PerfilId = Type.Union([
  Type.Literal('bezerro-macho-nelore'),
  Type.Literal('bezerro-macho-mestico'),
  Type.Literal('bezerra-femea-nelore'),
  Type.Literal('bezerra-femea-mestica'),
  Type.Literal('garrote-macho-nelore'),
  Type.Literal('garrote-macho-mestico'),
  Type.Literal('novilha-femea-nelore'),
  Type.Literal('novilha-femea-mestica'),
]);

export const RegiaoId = Type.Union([
  Type.Literal('metropolitana-goiania'),
  Type.Literal('centro-goiano'),
  Type.Literal('norte-goiano'),
  Type.Literal('nordeste-goiano'),
  Type.Literal('entorno-df'),
  Type.Literal('sudeste-goiano'),
  Type.Literal('sul-goiano'),
  Type.Literal('sudoeste-goiano'),
  Type.Literal('oeste-goiano'),
  Type.Literal('noroeste-goiano'),
]);

export const DataCivil = Type.String({
  format: 'date',
  pattern: '^(?!0000)[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\\s\\S])',
});

export const InstanteUtc = Type.String({
  format: 'date-time',
  pattern:
    '^(?!0000)[0-9]{4}-[0-9]{2}-[0-9]{2}T(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\\.[0-9]{3}Z(?![\\s\\S])',
});

export const Preco = Type.String({
  pattern: '^(?:0|[1-9][0-9]{0,9})\\.[0-9]{2}(?![\\s\\S])',
  not: { const: '0.00' },
});

export const Peso = Type.String({
  pattern: '^(?:0|[1-9][0-9]{0,5})\\.[0-9]{2}(?![\\s\\S])',
  not: { const: '0.00' },
});

export const Categoria = Type.Union([
  Type.Literal('Bezerro'),
  Type.Literal('Bezerra'),
  Type.Literal('Garrote'),
  Type.Literal('Novilha'),
]);

export const Sexo = Type.Union([Type.Literal('Macho'), Type.Literal('Fêmea')]);

export const GrupoRacial = Type.Union([
  Type.Literal('Nelore'),
  Type.Literal('Mestiço'),
  Type.Literal('Mestiça'),
]);

export const Janela = Type.Object(
  {
    inicio: ref('DataCivil', DataCivil),
    fim: ref('DataCivil', DataCivil),
    primeiraSemana: ref('DataCivil', DataCivil),
    ultimaSemana: ref('DataCivil', DataCivil),
    semanaAnterior: ref('DataCivil', DataCivil),
    quantidadeSemanasNaJanela: Type.Integer({ minimum: 52, maximum: 53 }),
  },
  { additionalProperties: false },
);

export const Perfil = Type.Object(
  {
    id: ref('PerfilId', PerfilId),
    ordem: Type.Integer({ minimum: 1, maximum: 8 }),
    categoria: ref('Categoria', Categoria),
    sexo: ref('Sexo', Sexo),
    grupoRacial: ref('GrupoRacial', GrupoRacial),
    idadeReferenciaMeses: Type.Integer({ minimum: 1, maximum: 32767 }),
    pesoReferencia: ref('Peso', Peso),
    unidadePeso: Type.Literal('kg'),
    referenciaParametrosId: ref('Identificador', Identificador),
  },
  { additionalProperties: false },
);

export const Regiao = Type.Object(
  {
    id: ref('RegiaoId', RegiaoId),
    ordem: Type.Integer({ minimum: 1, maximum: 10 }),
    codigoImb: Type.Union([
      Type.Literal('001'),
      Type.Literal('002'),
      Type.Literal('003'),
      Type.Literal('004'),
      Type.Literal('005'),
      Type.Literal('006'),
      Type.Literal('007'),
      Type.Literal('008'),
      Type.Literal('009'),
      Type.Literal('010'),
    ]),
    nome: Type.String({ minLength: 1, maxLength: 160 }),
    versaoTerritorial: ref('Identificador', Identificador),
    quantidadeMunicipios: Type.Integer({ minimum: 1, maximum: 1000 }),
  },
  { additionalProperties: false },
);

export const Condicoes = Type.Object(
  {
    id: Type.Literal('avista-sem-frete-sem-tributos'),
    pagamento: Type.Literal('à vista'),
    frete: Type.Literal('excluído'),
    tributos: Type.Literal('excluídos'),
    descricao: Type.String({ minLength: 1, maxLength: 512 }),
  },
  { additionalProperties: false },
);

export const Fonte = Type.Object(
  {
    id: ref('Identificador', Identificador),
    instituicao: Type.String({ minLength: 1, maxLength: 160 }),
    url: Type.String({ minLength: 1, maxLength: 2048, format: 'uri', pattern: '^https://' }),
    consultadaEm: ref('DataCivil', DataCivil),
    uso: Type.String({ minLength: 1, maxLength: 512 }),
  },
  { additionalProperties: false },
);

export const PrecoRegional = Type.Object(
  {
    perfilId: ref('PerfilId', PerfilId),
    regiaoId: ref('RegiaoId', RegiaoId),
    semana: ref('DataCivil', DataCivil),
    preco: ref('Preco', Preco),
    moeda: Type.Literal('BRL'),
    unidadePreco: Type.Literal('cabeca'),
    natureza: Type.Literal('demonstrativa'),
    conjuntoId: ref('Identificador', Identificador),
    condicoesComerciaisId: Type.Literal('avista-sem-frete-sem-tributos'),
  },
  { additionalProperties: false },
);

export const ReferenciaSemanal = Type.Object(
  {
    perfilId: ref('PerfilId', PerfilId),
    semana: ref('DataCivil', DataCivil),
    regioesAusentes: Type.Array(ref('RegiaoId', RegiaoId), {
      minItems: 0,
      maxItems: 10,
      uniqueItems: true,
    }),
  },
  { additionalProperties: false },
);

export const Resumo = Type.Object(
  {
    schemaVersion: Type.Literal('1.0.0'),
    versaoDados: ref('Identificador', Identificador),
    publicadoEm: ref('InstanteUtc', InstanteUtc),
    natureza: Type.Literal('demonstrativa'),
    conjuntoId: ref('Identificador', Identificador),
    aviso: Type.String({ minLength: 1, maxLength: 512 }),
    versaoTerritorial: ref('Identificador', Identificador),
    janela: ref('Janela', Janela),
    condicoesComerciais: Type.Array(ref('Condicoes', Condicoes), { minItems: 1, maxItems: 1 }),
    referenciasFontes: Type.Array(ref('Fonte', Fonte), { minItems: 2, maxItems: 2 }),
    perfis: Type.Array(ref('Perfil', Perfil), { minItems: 8, maxItems: 8 }),
    regioes: Type.Array(ref('Regiao', Regiao), { minItems: 10, maxItems: 10 }),
    referenciasSemanais: Type.Array(ref('ReferenciaSemanal', ReferenciaSemanal), {
      minItems: 16,
      maxItems: 16,
    }),
    precos: Type.Array(ref('PrecoRegional', PrecoRegional), { minItems: 0, maxItems: 160 }),
  },
  { additionalProperties: false },
);

export const Historico = Type.Object(
  {
    schemaVersion: Type.Literal('1.0.0'),
    versaoDados: ref('Identificador', Identificador),
    publicadoEm: ref('InstanteUtc', InstanteUtc),
    natureza: Type.Literal('demonstrativa'),
    conjuntoId: ref('Identificador', Identificador),
    aviso: Type.String({ minLength: 1, maxLength: 512 }),
    versaoTerritorial: ref('Identificador', Identificador),
    janela: ref('Janela', Janela),
    condicoesComerciais: Type.Array(ref('Condicoes', Condicoes), { minItems: 1, maxItems: 1 }),
    referenciasFontes: Type.Array(ref('Fonte', Fonte), { minItems: 2, maxItems: 2 }),
    perfilId: ref('PerfilId', PerfilId),
    referenciasSemanais: Type.Array(ref('ReferenciaSemanal', ReferenciaSemanal), {
      minItems: 53,
      maxItems: 54,
    }),
    precos: Type.Array(ref('PrecoRegional', PrecoRegional), { minItems: 0, maxItems: 540 }),
  },
  { additionalProperties: false },
);

export const ConsultaResumo = Type.Object({}, { additionalProperties: false, required: [] });

export const ConsultaHistorico = Type.Object(
  {
    perfilId: ref('Identificador', Identificador),
    versaoDados: ref('Identificador', Identificador),
  },
  { additionalProperties: false },
);

export const Erro = Type.Object(
  {
    schemaVersion: Type.Literal('1.0.0'),
    erro: Type.Object(
      {
        codigo: Type.Union([
          Type.Literal('PARAMETROS_INVALIDOS'),
          Type.Literal('PERFIL_INEXISTENTE'),
          Type.Literal('VERSAO_INDISPONIVEL'),
          Type.Literal('LIMITE_REQUISICOES'),
          Type.Literal('SERVICO_OCUPADO'),
          Type.Literal('CONTROLE_INDISPONIVEL'),
          Type.Literal('DADOS_INDISPONIVEIS'),
          Type.Literal('ERRO_INTERNO'),
        ]),
        mensagem: Type.String({ minLength: 1, maxLength: 256 }),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const ETag = Type.String({
  maxLength: 100,
  pattern: '^W/"v1-(?:resumo|historico)-[0-9a-f]{64}"(?![\\s\\S])',
});

export const RevisaoLocal = Type.Integer({ minimum: 1, maximum: 9007199254740991 });

export const ResumoSalvo = Type.Object(
  {
    schemaVersion: Type.Literal('1.0.0'),
    versaoDados: ref('Identificador', Identificador),
    dados: ref('Resumo', Resumo),
    etag: ref('ETag', ETag),
    recebidoEm: ref('InstanteUtc', InstanteUtc),
    verificadoEm: ref('InstanteUtc', InstanteUtc),
    ordemUso: ref('RevisaoLocal', RevisaoLocal),
  },
  { additionalProperties: false },
);

export const HistoricoSalvo = Type.Object(
  {
    schemaVersion: Type.Literal('1.0.0'),
    versaoDados: ref('Identificador', Identificador),
    perfilId: ref('PerfilId', PerfilId),
    dados: ref('Historico', Historico),
    etag: ref('ETag', ETag),
    recebidoEm: ref('InstanteUtc', InstanteUtc),
    verificadoEm: ref('InstanteUtc', InstanteUtc),
    ordemUso: ref('RevisaoLocal', RevisaoLocal),
  },
  { additionalProperties: false },
);

export const FiltrosSalvos = Type.Object(
  {
    categoria: Type.Union([ref('Categoria', Categoria), Type.Null()]),
    sexo: Type.Union([ref('Sexo', Sexo), Type.Null()]),
    grupoRacial: Type.Union([ref('GrupoRacial', GrupoRacial), Type.Null()]),
    regiaoId: Type.Union([ref('RegiaoId', RegiaoId), Type.Null()]),
    inicio: ref('DataCivil', DataCivil),
    fim: ref('DataCivil', DataCivil),
    modoTabela: Type.Union([Type.Literal('recente'), Type.Literal('periodo')]),
  },
  { additionalProperties: false },
);

export const ConsultaSalva = Type.Object(
  {
    chave: Type.Literal('consultaSalva'),
    revisao: ref('RevisaoLocal', RevisaoLocal),
    schemaVersion: Type.Literal('1.0.0'),
    versaoDados: ref('Identificador', Identificador),
    etapa: Type.Union([Type.Literal('resumo'), Type.Literal('completa')]),
    filtros: ref('FiltrosSalvos', FiltrosSalvos),
    perfilAtivoId: Type.Union([ref('PerfilId', PerfilId), Type.Null()]),
    perfisHistorico: Type.Array(ref('PerfilId', PerfilId), {
      minItems: 0,
      maxItems: 8,
      uniqueItems: true,
    }),
  },
  { additionalProperties: false },
);

export const definitions = {
  Identificador,
  PerfilId,
  RegiaoId,
  DataCivil,
  InstanteUtc,
  Preco,
  Peso,
  Categoria,
  Sexo,
  GrupoRacial,
  Janela,
  Perfil,
  Regiao,
  Condicoes,
  Fonte,
  PrecoRegional,
  ReferenciaSemanal,
  Resumo,
  Historico,
  ConsultaResumo,
  ConsultaHistorico,
  Erro,
  ETag,
  RevisaoLocal,
  ResumoSalvo,
  HistoricoSalvo,
  FiltrosSalvos,
  ConsultaSalva,
};
export type ContractName = keyof typeof definitions;
export const contractSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'urn:pecuaria-inteligente:contratos:v1',
  $ref: '#/definitions/Resumo',
  definitions,
};
