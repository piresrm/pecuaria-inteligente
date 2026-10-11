// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import type { Filtros, Resumo, Historico } from '@pecuaria/contracts/types';
import { QueryCoordinator } from './coordinator';
import type { Recurso } from './state';
import resumoJson from '../../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json';
import historicoJson from '../../../../docs/superpowers/contracts/v0.1/historico.exemplo.json';
const resumo = resumoJson as Resumo;
const historico = historicoJson as Historico;
const recurso = <T>(dados: T): Recurso<T> => ({
  dados,
  etag: 'W/"v1-resumo-' + 'a'.repeat(64) + '"',
  recebidoEm: '2026-10-07T12:00:00.000Z',
  verificadoEm: '2026-10-07T12:00:00.000Z',
});
const filtros: Filtros = {
  categoria: 'Bezerro',
  sexo: 'Macho',
  grupoRacial: 'Nelore',
  regiaoId: null,
  inicio: resumo.janela.inicio,
  fim: resumo.janela.fim,
  modoTabela: 'recente',
};
function controlled<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
describe('coordenação progressiva', () => {
  it('exibe resumo antes do histórico; altera filtros localmente sem I/O', async () => {
    const h = controlled<Recurso<Historico>>();
    const api = {
      resumo: vi.fn(() => Promise.resolve(recurso(resumo))),
      historico: vi.fn(() => h.promise),
    };
    const c = new QueryCoordinator(api);
    const states: string[] = [];
    c.subscribe((s) => states.push(s.etapa ?? 'vazia'));
    const pending = c.consultar(filtros, historico.perfilId);
    await vi.waitFor(() => expect(c.state.etapa).toBe('resumo'));
    expect(c.state.exibido?.resultado.serie).toEqual([]);
    expect(c.state.exibido?.resultado.indicadores.variacaoPeriodo).toBeNull();
    h.resolve(recurso(historico));
    await pending;
    expect(states).toContain('resumo');
    expect(c.state.etapa).toBe('completa');
    await c.consultar({ ...filtros, regiaoId: 'centro-goiano' }, historico.perfilId);
    expect(api.resumo).toHaveBeenCalledTimes(1);
    expect(api.historico).toHaveBeenCalledTimes(1);
  });
  it('não aplica resposta antiga após geração mais recente nem fabrica período sem histórico', async () => {
    const h = controlled<Recurso<Historico>>();
    const c = new QueryCoordinator({
      resumo: () => Promise.resolve(recurso(resumo)),
      historico: () => h.promise,
    });
    const first = c.consultar(filtros, historico.perfilId);
    await vi.waitFor(() => expect(c.state.etapa).toBe('resumo'));
    const next = c.consultar(
      { ...filtros, regiaoId: 'centro-goiano', modoTabela: 'periodo' },
      historico.perfilId,
    );
    h.reject(new Error('rede'));
    await Promise.all([first, next]);
    expect(c.state.solicitado?.filtros.modoTabela).toBe('periodo');
    expect(c.state.exibido?.filtros.modoTabela).toBe('recente');
    expect(c.state.erros[historico.perfilId]).toBeDefined();
  });
  it('prepara versão separada até todas dependências e ignora ordem de relógios/identificadores', async () => {
    const second = { ...resumo, versaoDados: 'a', publicadoEm: '2020-10-07T12:00:00.000Z' };
    const h = controlled<Recurso<Historico>>();
    let version = 0;
    const c = new QueryCoordinator({
      resumo: () => Promise.resolve(recurso(version++ === 0 ? resumo : second)),
      historico: async (_id, v) => (v === resumo.versaoDados ? recurso(historico) : h.promise),
    });
    await c.consultar(filtros, historico.perfilId);
    const old = c.state.exibido;
    const verification = c.verificar();
    await vi.waitFor(() => expect(version).toBe(2));
    expect(c.state.exibido).toBe(old);
    h.resolve(recurso({ ...historico, versaoDados: 'a', publicadoEm: second.publicadoEm }));
    await verification;
    expect(c.state.exibido?.resumo.dados.versaoDados).toBe('a');
    expect(c.state.exibido?.filtros).toEqual(filtros);
  });
});
it('409 reconstrói com novo resumo e mantém anterior até dependências completas', async () => {
  const next = { ...resumo, versaoDados: 'segunda' };
  const h = controlled<Recurso<Historico>>();
  let calls = 0;
  let historical = 0;
  const { MercadoError } = await import('./client');
  const c = new QueryCoordinator({
    resumo: () => Promise.resolve(recurso(calls++ === 0 ? resumo : next)),
    historico: async () => {
      historical++;
      if (historical === 1) return recurso(historico);
      if (historical === 2) throw new MercadoError('versão removida', 409);
      return h.promise;
    },
  });
  await c.consultar(filtros, historico.perfilId);
  const old = c.state.exibido;
  // Ask an uncached profile: old version was removed while the summary remained locally usable.
  const requested = { ...filtros, grupoRacial: 'Mestiço' as const };
  const pending = c.consultar(requested, 'bezerro-macho-mestico');
  await vi.waitFor(() => expect(calls).toBe(2));
  expect(c.state.exibido).toBe(old);
  h.reject(new Error('interrupção'));
  await pending;
  expect(c.state.exibido).toBe(old);
  expect(c.state.solicitado?.filtros).toEqual(requested);
});
it('modo período exige todos históricos elegíveis; conjunto vazio conclui sem histórico', async () => {
  const calls: string[] = [];
  const c = new QueryCoordinator({
    resumo: () => Promise.resolve(recurso(resumo)),
    historico: (id) => {
      calls.push(id);
      return Promise.reject(new Error('sem dados'));
    },
  });
  await c.consultar({ ...filtros, grupoRacial: null, modoTabela: 'periodo' }, historico.perfilId);
  expect(calls.sort()).toEqual(['bezerro-macho-mestico', 'bezerro-macho-nelore']);
  expect(c.state.exibido).toBeNull();
  await c.consultar({ ...filtros, sexo: 'Fêmea', modoTabela: 'periodo' }, historico.perfilId);
  expect(c.state.etapa).toBe('completa');
  expect(c.state.exibido?.perfilAtivoId).toBeNull();
  expect(c.state.exibido?.resultado.linhas).toEqual([]);
});
it('409 não deixa falhas antigas de outros históricos alterarem a fotografia reconstruída', async () => {
  const { baseFixa } = await import('../../../../packages/domain/src/fixtures');
  const { MercadoError } = await import('./client');
  const old = baseFixa.resumo;
  const next = { ...old, versaoDados: 'reconstruida' };
  const abandoned = controlled<Recurso<Historico>>();
  let summaries = 0;
  const c = new QueryCoordinator({
    resumo: () => Promise.resolve(recurso(summaries++ === 0 ? old : next)),
    historico: (id, version) => {
      const h = baseFixa.historicos.find((h) => h.perfilId === id)!;
      if (version === next.versaoDados)
        return Promise.resolve(recurso({ ...h, versaoDados: next.versaoDados }));
      if (id === old.perfis[0]?.id) return Promise.resolve(recurso(h));
      if (id === old.perfis[1]?.id) return Promise.reject(new MercadoError('versão removida', 409));
      return abandoned.promise;
    },
  });
  await c.consultar(filtros, historico.perfilId);
  await c.consultar(
    { ...filtros, categoria: null, sexo: null, grupoRacial: null, modoTabela: 'periodo' },
    historico.perfilId,
  );
  expect(c.state.exibido?.resumo.dados.versaoDados).toBe('reconstruida');
  expect(Object.keys(c.state.exibido?.historicos ?? {})).toHaveLength(8);
  abandoned.reject(new Error('resposta antiga'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(c.state.erros).toEqual({});
  expect(c.state.etapa).toBe('completa');
});
it('inicialização pendente não substitui filtros de uma geração posterior', async () => {
  const summary = controlled<Recurso<Resumo>>();
  const c = new QueryCoordinator({
    resumo: () => summary.promise,
    historico: () => Promise.resolve(recurso(historico)),
  });
  const initial = c.iniciar();
  const user = c.consultar({ ...filtros, regiaoId: 'centro-goiano' }, historico.perfilId);
  summary.resolve(recurso(resumo));
  await Promise.all([initial, user]);
  expect(c.state.solicitado?.filtros.regiaoId).toBe('centro-goiano');
});
it('filtro local não conta como verificação de rede nem remove aviso de idade', async () => {
  let clock = 0;
  const c = new QueryCoordinator(
    {
      resumo: () => Promise.resolve(recurso(resumo)),
      historico: () => Promise.resolve(recurso(historico)),
    },
    () => clock,
  );
  await c.consultar(filtros, historico.perfilId);
  expect(c.state.ultimaVerificacao).toBe(0);
  clock = 1000000;
  c.setStale(true);
  await c.consultar({ ...filtros, regiaoId: 'centro-goiano' }, historico.perfilId);
  expect(c.state.ultimaVerificacao).toBe(0);
  expect(c.state.desatualizado).toBe(true);
});
it('resposta bem-sucedida atrasada não substitui perfil/filtros da consulta mais recente', async () => {
  const { baseFixa } = await import('../../../../packages/domain/src/fixtures');
  const old = controlled<Recurso<Historico>>();
  const next = baseFixa.historicos[1]!;
  const c = new QueryCoordinator({
    resumo: () => Promise.resolve(recurso(baseFixa.resumo)),
    historico: (id) => (id === historico.perfilId ? old.promise : Promise.resolve(recurso(next))),
  });
  const first = c.consultar(filtros, historico.perfilId);
  await vi.waitFor(() => expect(c.state.etapa).toBe('resumo'));
  await c.consultar(
    { ...filtros, grupoRacial: 'Mestiço', regiaoId: 'centro-goiano' },
    next.perfilId,
  );
  const displayed = c.state.exibido;
  old.resolve(recurso(baseFixa.historicos[0]!));
  await first;
  expect(c.state.exibido).toBe(displayed);
  expect(c.state.exibido?.perfilAtivoId).toBe(next.perfilId);
  expect(c.state.exibido?.filtros.regiaoId).toBe('centro-goiano');
});
