import { describe, expect, it } from 'vitest';
import type { Filtros } from '@pecuaria/contracts/types';
import { baseFixa } from './fixtures.js';
import { calcularConsulta, filtrarPerfis } from './index.js';
import { decimalApresentado } from './presentation.js';
const { resumo, historicos } = baseFixa;
const perfil = 'bezerro-macho-nelore';
const filtros = (alteracoes: Partial<Filtros> = {}): Filtros => ({
  categoria: null,
  sexo: null,
  grupoRacial: null,
  regiaoId: null,
  inicio: resumo.janela.inicio,
  fim: resumo.janela.fim,
  modoTabela: 'periodo',
  ...alteracoes,
});
const consultar = (alteracoes: Partial<Filtros> = {}, ativo: string | null = perfil) =>
  calcularConsulta(resumo, historicos, filtros(alteracoes), ativo);
describe('cenários literais da base fixa CA04–CA08', () => {
  it('CA04 exclui ausências e apresenta média 3368.75 com cobertura 8/10', () => {
    const consulta = consultar({ inicio: '2026-09-28', fim: '2026-09-28' });
    expect(consulta.indicadores.media).toBe('3368.75');
    expect(consulta.indicadores.cobertura).toMatchObject({ disponiveis: 8, total: 10 });
    expect(consulta.linhas.filter((l) => l.perfilId === perfil)).toHaveLength(11);
    expect(
      consulta.linhas.find((l) => l.perfilId === perfil && l.regiaoId === 'centro-goiano'),
    ).toMatchObject({ semana: '2026-09-28', preco: null, precoPorKg: null });
  });
  it('CA05 mantém semana sem preços como lacuna, sem média ou zero', () => {
    const c = consultar({ inicio: '2026-02-02', fim: '2026-02-02' });
    expect(c.indicadores).toMatchObject({
      media: null,
      semana: null,
      precoPorKg: null,
      variacaoSemanal: null,
      variacaoPeriodo: null,
    });
    expect(c.serie).toMatchObject([
      { semana: '2026-02-02', media: null, cobertura: { disponiveis: 0, total: 10 } },
    ]);
  });
  it('CA06 compara 3000 → 3150 inclusive referência fora do intervalo', () => {
    const i = consultar({
      inicio: '2026-09-28',
      fim: '2026-09-28',
      regiaoId: 'sudoeste-goiano',
    }).indicadores;
    expect(i.media).toBe('3150');
    expect(i.variacaoSemanal).toMatchObject({
      absoluta: '150',
      percentual: '5',
      inicio: '2026-09-21',
      fim: '2026-09-28',
      composicaoAlterada: false,
    });
    expect(decimalApresentado(i.variacaoSemanal?.absoluta ?? null, 2)).toBe('150.00');
    expect(decimalApresentado(i.variacaoSemanal?.percentual ?? null, 1)).toBe('5.0');
  });
  it('CA07 não substitui semana imediatamente anterior ausente por outra', () => {
    const c = consultar({
      inicio: '2026-05-25',
      fim: '2026-06-08',
      regiaoId: 'metropolitana-goiania',
    });
    expect(c.indicadores.variacaoSemanal).toBeNull();
    expect(c.indicadores.variacaoPeriodo).toMatchObject({
      inicio: '2026-05-25',
      fim: '2026-06-08',
    });
    expect(c.serie.map((p) => p.media === null)).toEqual([false, true, false]);
  });
  it('CA07 não calcula período com única semana', () => {
    expect(
      consultar({ inicio: '2026-09-28', fim: '2026-09-28', regiaoId: 'sudoeste-goiano' })
        .indicadores.variacaoPeriodo,
    ).toBeNull();
  });
  it('CA08 compara conjuntos diferentes mesmo com coberturas numericamente iguais', () => {
    const i = consultar({ inicio: '2026-09-21', fim: '2026-09-28' }).indicadores;
    expect(i.variacaoPeriodo).toMatchObject({
      absoluta: '150',
      composicaoAlterada: true,
      coberturaAnterior: { disponiveis: 8 },
      coberturaAtual: { disponiveis: 8 },
    });
    expect(decimalApresentado(i.variacaoPeriodo?.percentual ?? null, 1)).toBe('4.7');
    expect(i.variacaoSemanal?.coberturaAnterior.regioesPresentes).toEqual([
      'metropolitana-goiania',
      'centro-goiano',
      'norte-goiano',
      'nordeste-goiano',
      'entorno-df',
      'sudeste-goiano',
      'sul-goiano',
      'sudoeste-goiano',
    ]);
    expect(i.variacaoSemanal?.coberturaAtual.regioesPresentes).toEqual([
      'norte-goiano',
      'nordeste-goiano',
      'entorno-df',
      'sudeste-goiano',
      'sul-goiano',
      'sudoeste-goiano',
      'oeste-goiano',
      'noroeste-goiano',
    ]);
    expect(i.variacaoPeriodo?.percentual).toBe('4.66019417475728155339805825242718446602');
  });
  it('RN07 usa referência anterior à janela apenas para variação semanal', () => {
    const c = consultar({ inicio: '2025-10-01', fim: '2025-10-06', regiaoId: 'sudoeste-goiano' });
    expect(c.indicadores.variacaoSemanal).toMatchObject({
      inicio: '2025-09-29',
      fim: '2025-10-06',
    });
    expect(c.serie.map((p) => p.semana)).toEqual(['2025-10-06']);
    expect(c.indicadores.variacaoPeriodo).toBeNull();
  });
  it('preserva as duas lacunas consecutivas do Nordeste', () => {
    const c = consultar(
      { inicio: '2025-10-27', fim: '2025-11-17', regiaoId: 'nordeste-goiano' },
      'bezerra-femea-nelore',
    );
    expect(c.serie.map((p) => p.media === null)).toEqual([false, true, true, false]);
    expect(c.indicadores.variacaoSemanal).toBeNull();
  });
});
describe('recortes, completude e integridade da consulta', () => {
  it('combina os três filtros sem alterar cadastro e mantém ordem de perfis', () => {
    expect(
      filtrarPerfis(resumo, filtros({ sexo: 'Fêmea', grupoRacial: 'Nelore' })).map((p) => p.id),
    ).toEqual(['bezerra-femea-nelore', 'novilha-femea-nelore']);
    expect(
      filtrarPerfis(
        resumo,
        filtros({ categoria: 'Garrote', sexo: 'Macho', grupoRacial: 'Mestiço' }),
      ).map((p) => p.id),
    ).toEqual(['garrote-macho-mestico']);
  });
  it('nenhum perfil elegível é resultado vazio completo sem históricos', () => {
    const c = calcularConsulta(resumo, [], filtros({ categoria: 'Bezerro', sexo: 'Fêmea' }), null);
    expect(c.linhas).toEqual([]);
    expect(c.serie).toEqual([]);
    expect(c.indicadores.media).toBeNull();
    expect(c.indicadores.perfilId).toBeNull();
  });
  it.each([
    { inicio: '2026-06-10', fim: '2026-06-01' },
    { inicio: '2025-09-29' },
    { fim: '2026-10-01' },
    { inicio: '2026-02-29' },
    { inicio: '2026-2-01' },
    { modoTabela: 'recente' as const, inicio: '2026-09-21' },
  ])('rejeita intervalo inválido %j sem mutar entradas', (f) => {
    const antes = JSON.stringify({ resumo, historicos });
    expect(() => consultar(f)).toThrow(RangeError);
    expect(JSON.stringify({ resumo, historicos })).toBe(antes);
  });
  it('semana de referência varia por perfil e recorte regional', () => {
    const c = consultar({
      inicio: '2026-09-21',
      fim: '2026-09-28',
      regiaoId: 'metropolitana-goiania',
    });
    expect(c.linhas.find((l) => l.perfilId === perfil)).toMatchObject({
      semana: '2026-09-21',
      preco: '2950',
    });
    expect(c.linhas.find((l) => l.perfilId === 'bezerro-macho-mestico')).toMatchObject({
      semana: '2026-09-28',
    });
    expect(c.indicadores.semana).toBe('2026-09-21');
    expect(c.indicadores.variacaoPeriodo).toBeNull();
  });
  it('resumo recente produz tabela e semana disponíveis, série/período pendentes', () => {
    const c = calcularConsulta(resumo, [], filtros({ modoTabela: 'recente' }), perfil);
    expect(c.indicadores.media).toBe('3368.75');
    expect(c.indicadores.variacaoSemanal?.absoluta).toBe('150');
    expect(c.serie).toEqual([]);
    expect(c.indicadores.variacaoPeriodo).toBeNull();
  });
  it('recente com histórico ativo representa todas 52 semanas com lacuna', () => {
    const h = historicos.filter((h) => h.perfilId === perfil);
    const c = calcularConsulta(resumo, h, filtros({ modoTabela: 'recente' }), perfil);
    expect(c.serie).toHaveLength(52);
    expect(c.serie.find((p) => p.semana === '2026-02-02')?.media).toBeNull();
    expect(c.indicadores.variacaoPeriodo?.inicio).toBe('2025-10-06');
  });
  it('rejeita período incompleto em vez de produzir consulta parcial', () => {
    expect(() => calcularConsulta(resumo, historicos.slice(0, 1), filtros(), perfil)).toThrow(
      'Histórico obrigatório',
    );
  });
  it('rejeita perfil ativo incompatível ou nulo com perfis elegíveis', () => {
    expect(() => consultar({ sexo: 'Fêmea' })).toThrow('Perfil ativo');
    expect(() => consultar({}, null)).toThrow('Perfil ativo');
    expect(() => consultar({ categoria: 'Bezerro', sexo: 'Fêmea' }, perfil)).toThrow(
      'Perfil ativo',
    );
  });
  it('rejeita históricos de outra versão, repetidos e com IDs incoerentes', () => {
    const outro = structuredClone(historicos);
    outro[0]!.versaoDados = 'outra-versao';
    expect(() => calcularConsulta(resumo, outro, filtros(), perfil)).toThrow(
      'Histórico incompatível',
    );
    expect(() =>
      calcularConsulta(resumo, [...historicos, historicos[0]!], filtros(), perfil),
    ).toThrow('Histórico incompatível');
    const incoerente = structuredClone(historicos);
    incoerente[0]!.precos[0]!.perfilId = 'bezerro-macho-mestico';
    expect(() => calcularConsulta(resumo, incoerente, filtros(), perfil)).toThrow(
      'Histórico incompatível',
    );
  });
  it('não mistura moeda ou condições comerciais', () => {
    const incoerente = structuredClone(historicos);
    Object.assign(incoerente[0]!.precos[0]!, { condicoesComerciaisId: 'outro-prazo' });
    expect(() => calcularConsulta(resumo, incoerente, filtros(), perfil)).toThrow(
      'Histórico incompatível',
    );
  });
  it('cálculo mantém entradas completas intactas', () => {
    const antes = JSON.stringify(baseFixa);
    consultar();
    expect(JSON.stringify(baseFixa)).toBe(antes);
  });
});
it('rejeita histórico truncado e metadados de janela incoerentes', () => {
  const truncado = structuredClone(historicos);
  truncado[0]!.referenciasSemanais.pop();
  expect(() => calcularConsulta(resumo, truncado, filtros(), perfil)).toThrow(
    'Histórico incompatível',
  );
  const janela = structuredClone(historicos);
  janela[0]!.janela.semanaAnterior = '2025-09-22';
  expect(() => calcularConsulta(resumo, janela, filtros(), perfil)).toThrow(
    'Histórico incompatível',
  );
});
