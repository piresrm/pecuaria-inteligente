import { expect, test } from 'vitest';
import historico from '../../../docs/superpowers/contracts/v0.1/historico.exemplo.json' with { type: 'json' };
import resumo from '../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json' with { type: 'json' };
import { assertHistorico, assertResumo } from './semantic.js';
import { assertHistorico as browserHistorico, assertResumo as browserResumo } from './browser.js';

const perfilId = 'bezerro-macho-nelore';
const summaryAssertions = [assertResumo, browserResumo];
const historyAssertions = [assertHistorico, browserHistorico];

test('aceita exemplos, incluindo semana inteiramente ausente', () => {
  for (const assert of summaryAssertions) expect(() => assert(resumo)).not.toThrow();
  const snapshot: unknown = structuredClone(resumo);
  assertResumo(snapshot);
  for (const assert of historyAssertions)
    expect(() => assert(historico, snapshot, perfilId)).not.toThrow();
});

test.each([
  [
    'contagem incoerente',
    { ...resumo, janela: { ...resumo.janela, quantidadeSemanasNaJanela: 53 } },
  ],
  ['janela incompleta', { ...resumo, janela: { ...resumo.janela, inicio: '2025-10-02' } }],
  [
    'dia diferente de segunda-feira',
    { ...resumo, janela: { ...resumo.janela, ultimaSemana: '2026-09-29' } },
  ],
  [
    'cadastro incompatível',
    { ...resumo, perfis: resumo.perfis.map((p, i) => (i === 0 ? { ...p, sexo: 'Fêmea' } : p)) },
  ],
  [
    'peso do cadastro divergente',
    {
      ...resumo,
      perfis: resumo.perfis.map((p, i) => (i === 0 ? { ...p, pesoReferencia: '1.00' } : p)),
    },
  ],
  [
    'região duplicada',
    { ...resumo, regioes: resumo.regioes.map((r, i) => (i === 1 ? resumo.regioes[0] : r)) },
  ],
  ['preço duplicado', { ...resumo, precos: [...resumo.precos, resumo.precos[0]] }],
  [
    'partição incompleta',
    {
      ...resumo,
      referenciasSemanais: resumo.referenciasSemanais.map((r, i) =>
        i === 0 ? { ...r, regioesAusentes: [] } : r,
      ),
    },
  ],
  [
    'partição com sobreposição',
    {
      ...resumo,
      referenciasSemanais: resumo.referenciasSemanais.map((r, i) =>
        i === 0 ? { ...r, regioesAusentes: ['metropolitana-goiania', ...r.regioesAusentes] } : r,
      ),
    },
  ],
  [
    'origem divergente',
    {
      ...resumo,
      precos: resumo.precos.map((p, i) => (i === 0 ? { ...p, conjuntoId: 'outra-origem' } : p)),
    },
  ],
  [
    'referência duplicada',
    {
      ...resumo,
      referenciasSemanais: resumo.referenciasSemanais.map((r, i) =>
        i === 1 ? resumo.referenciasSemanais[0] : r,
      ),
    },
  ],
  [
    'referência fora das duas semanas',
    {
      ...resumo,
      referenciasSemanais: resumo.referenciasSemanais.map((r, i) =>
        i === 0 ? { ...r, semana: '2026-09-14' } : r,
      ),
    },
  ],
  [
    'fonte inexistente',
    {
      ...resumo,
      perfis: resumo.perfis.map((p, i) =>
        i === 0 ? { ...p, referenciaParametrosId: 'fonte-ausente' } : p,
      ),
    },
  ],
  ['ordem de preços alterada', { ...resumo, precos: [...resumo.precos].reverse() }],
])('rejeita %s no servidor e navegador', (_nome, value) => {
  for (const assert of summaryAssertions) expect(() => assert(value)).toThrow();
});

test.each([
  [
    'semana omitida',
    {
      ...historico,
      referenciasSemanais: historico.referenciasSemanais.filter((r) => r.semana !== '2026-02-02'),
    },
  ],
  ['versão diferente', { ...historico, versaoDados: 'outra-versao' }],
  ['metadado diferente', { ...historico, aviso: 'Aviso divergente' }],
  ['perfil diferente', { ...historico, perfilId: 'garrote-macho-nelore' }],
  [
    'preço comum divergente',
    {
      ...historico,
      precos: historico.precos.map((p) =>
        p.semana === '2026-09-28' ? { ...p, preco: '1.00' } : p,
      ),
    },
  ],
])('rejeita histórico com %s', (_nome, value) => {
  const snapshot: unknown = structuredClone(resumo);
  assertResumo(snapshot);
  for (const assert of historyAssertions) expect(() => assert(value, snapshot, perfilId)).toThrow();
});

test('aceita janela de 53 segundas-feiras e 54 referências no histórico', () => {
  // Calendário de 2024 conferido independentemente: 1/jan e 30/dez são segundas.
  const semanas = [
    '2023-12-25',
    '2024-01-01',
    '2024-01-08',
    '2024-01-15',
    '2024-01-22',
    '2024-01-29',
    '2024-02-05',
    '2024-02-12',
    '2024-02-19',
    '2024-02-26',
    '2024-03-04',
    '2024-03-11',
    '2024-03-18',
    '2024-03-25',
    '2024-04-01',
    '2024-04-08',
    '2024-04-15',
    '2024-04-22',
    '2024-04-29',
    '2024-05-06',
    '2024-05-13',
    '2024-05-20',
    '2024-05-27',
    '2024-06-03',
    '2024-06-10',
    '2024-06-17',
    '2024-06-24',
    '2024-07-01',
    '2024-07-08',
    '2024-07-15',
    '2024-07-22',
    '2024-07-29',
    '2024-08-05',
    '2024-08-12',
    '2024-08-19',
    '2024-08-26',
    '2024-09-02',
    '2024-09-09',
    '2024-09-16',
    '2024-09-23',
    '2024-09-30',
    '2024-10-07',
    '2024-10-14',
    '2024-10-21',
    '2024-10-28',
    '2024-11-04',
    '2024-11-11',
    '2024-11-18',
    '2024-11-25',
    '2024-12-02',
    '2024-12-09',
    '2024-12-16',
    '2024-12-23',
    '2024-12-30',
  ];
  const janela = {
    inicio: '2024-01-01',
    fim: '2024-12-31',
    primeiraSemana: '2024-01-01',
    ultimaSemana: '2024-12-30',
    semanaAnterior: '2023-12-25',
    quantidadeSemanasNaJanela: 53,
  };
  const regioesAusentes = resumo.regioes.map((r) => r.id);
  const summary = {
    ...resumo,
    janela,
    precos: [],
    referenciasSemanais: ['2024-12-23', '2024-12-30'].flatMap((semana) =>
      resumo.perfis.map((p) => ({ perfilId: p.id, semana, regioesAusentes })),
    ),
  };
  const history = {
    ...historico,
    janela,
    precos: [],
    referenciasSemanais: semanas.map((semana) => ({ perfilId, semana, regioesAusentes })),
  };
  for (const assert of summaryAssertions) expect(() => assert(summary)).not.toThrow();
  assertResumo(summary);
  for (const assert of historyAssertions)
    expect(() => assert(history, summary, perfilId)).not.toThrow();
});
