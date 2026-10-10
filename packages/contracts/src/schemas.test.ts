import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { expect, test } from 'vitest';
import consulta from '../../../docs/superpowers/contracts/v0.1/consulta-salva.exemplo.json' with { type: 'json' };
import erros from '../../../docs/superpowers/contracts/v0.1/erros.exemplos.json' with { type: 'json' };
import historico from '../../../docs/superpowers/contracts/v0.1/historico.exemplo.json' with { type: 'json' };
import documental from '../../../docs/superpowers/contracts/v0.1/mercado.schema.json' with { type: 'json' };
import resumo from '../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json' with { type: 'json' };
import { validators as browser } from './browser.js';
import { contractSchema } from './schemas.js';
import { validators as server } from './server.js';

type Nome = keyof typeof documental.definitions;
function compile(schema: object, nome: Nome) {
  const ajv = new Ajv({
    strict: true,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
    allErrors: false,
  });
  addFormats.default(ajv, { mode: 'full' });
  return ajv.compile({ ...schema, $ref: `#/definitions/${nome}` });
}
const reference = Object.fromEntries(
  Object.keys(documental.definitions).map((nome) => [nome, compile(documental, nome as Nome)]),
);
const declared = Object.fromEntries(
  Object.keys(documental.definitions).map((nome) => [nome, compile(contractSchema, nome as Nome)]),
);

function verificar(nome: Nome, value: unknown, expected: boolean) {
  const original = structuredClone(value);
  for (const validator of [reference[nome], declared[nome], server[nome], browser[nome]]) {
    if (!validator) throw new Error(`Validador ausente: ${nome}`);
    expect(validator(value)).toBe(expected);
    expect(value).toEqual(original);
  }
}

test.each([
  ['Resumo', resumo],
  ['Historico', historico],
  ['ConsultaSalva', consulta],
  ['FiltrosSalvos', consulta.filtros],
  ['Perfil', resumo.perfis[0]],
  ['Regiao', resumo.regioes[0]],
  ['PrecoRegional', resumo.precos[0]],
  ['ConsultaResumo', {}],
  ['ConsultaHistorico', { perfilId: historico.perfilId, versaoDados: resumo.versaoDados }],
] as const)('aceita exemplo documental de %s sem modificar dados', (nome, value) =>
  verificar(nome, value, true),
);

test.each(erros)('aceita corpo do erro HTTP $status', ({ corpo }) =>
  verificar('Erro', corpo, true),
);

test.each([
  '0.00',
  2950,
  '2950.001',
  '02950.00',
  '10000000000.00',
  'NaN',
  null,
  '-1.00',
  '1,00',
  '1.00\n',
])('rejeita preço %s sem coerção', (preco) => {
  verificar(
    'Resumo',
    { ...resumo, precos: resumo.precos.map((p, i) => (i === 0 ? { ...p, preco } : p)) },
    false,
  );
});

test.each(['0.01', '9999999999.99'])('aceita limites do preço %s', (preco) =>
  verificar('Preco', preco, true),
);
test.each(['0.00', 240, '240.001', '1000000.00'])('rejeita peso %s', (value) =>
  verificar('Peso', value, false),
);
test.each(['0.01', '999999.99'])('aceita limites do peso %s', (value) =>
  verificar('Peso', value, true),
);

test.each([
  ['LF final', { ...resumo, versaoDados: `${resumo.versaoDados}\n` }],
  ['campo extra', { ...resumo, outro: true }],
  ['data impossível', { ...resumo, janela: { ...resumo.janela, fim: '2026-02-30' } }],
  ['UTC sem milissegundos', { ...resumo, publicadoEm: '2026-10-07T12:00:00Z' }],
  ['segundo intercalar', { ...resumo, publicadoEm: '2026-10-07T12:00:60.000Z' }],
  ['ano zero', { ...resumo, publicadoEm: '0000-10-07T12:00:00.000Z' }],
  ['offset UTC alternativo', { ...resumo, publicadoEm: '2026-10-07T12:00:00.000+00:00' }],
  ['objeto aninhado aberto', { ...resumo, janela: { ...resumo.janela, extra: 1 } }],
  ['lista de cadastros incompleta', { ...resumo, perfis: resumo.perfis.slice(1) }],
])('rejeita %s em todos os validadores', (_nome, value) => verificar('Resumo', value, false));

test.each([
  {},
  { perfilId: 'a' },
  { perfilId: ['a'], versaoDados: 'b' },
  { perfilId: 'a', versaoDados: 'b', regiaoId: 'c' },
  { perfilId: '', versaoDados: 'b' },
  { perfilId: 'A', versaoDados: 'b' },
  { perfilId: 'a ', versaoDados: 'b' },
  { perfilId: 'a'.repeat(81), versaoDados: 'b' },
])('rejeita parâmetros de histórico inválidos: %s', (value) =>
  verificar('ConsultaHistorico', value, false),
);
test('resumo não recebe parâmetros', () => verificar('ConsultaResumo', { perfilId: 'a' }, false));

test.each(['2024-02-29', '0001-01-01', '9999-12-31'])('aceita data civil existente %s', (value) =>
  verificar('DataCivil', value, true),
);
test.each(['1900-02-29', '2025-04-31', '2024-13-01', '0000-01-01'])(
  'rejeita data civil impossível %s',
  (value) => verificar('DataCivil', value, false),
);

test.each([0, 1.5, 9007199254740992])('rejeita revisão local insegura %s', (value) =>
  verificar('RevisaoLocal', value, false),
);

test.each([
  [
    'ResumoSalvo',
    {
      schemaVersion: '1.0.0',
      versaoDados: resumo.versaoDados,
      dados: resumo,
      etag: `W/"v1-resumo-${'0'.repeat(64)}"`,
      recebidoEm: '2026-10-07T12:00:00.000Z',
      verificadoEm: '2026-10-07T11:00:00.000Z',
      ordemUso: 1,
    },
  ],
  [
    'HistoricoSalvo',
    {
      schemaVersion: '1.0.0',
      versaoDados: resumo.versaoDados,
      perfilId: historico.perfilId,
      dados: historico,
      etag: `W/"v1-historico-${'0'.repeat(64)}"`,
      recebidoEm: '2026-10-07T12:00:00.000Z',
      verificadoEm: '2026-10-07T11:00:00.000Z',
      ordemUso: 1,
    },
  ],
] as const)(
  'valida envelope %s com relógio retrocedido, sem promover campos extras',
  (nome, value) => {
    verificar(nome, value, true);
    verificar(nome, { ...value, segredo: 'extra' }, false);
    verificar(nome, { ...value, ordemUso: 0 }, false);
  },
);

test.each([
  ['moeda', { moeda: 'USD' }],
  ['unidade', { unidadePreco: 'kg' }],
  ['natureza', { natureza: 'observada' }],
] as const)('rejeita %s incompatível sem converter a entrada', (_nome, invalido) => {
  verificar('PrecoRegional', { ...resumo.precos[0], ...invalido }, false);
});
