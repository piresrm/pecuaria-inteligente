// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { deleteDB } from 'idb';
import { abrirArmazenamento, type StorageHandle } from './database';
import { confirmarConsulta, limparArmazenamento } from './saved-query';
import { recuperarConsulta } from './recovery';
import { calcularBytes } from './budget';
import { fixture } from '../../tests/storage-fixtures';
let storage: StorageHandle;

beforeEach(async () => {
  await deleteDB('pecuaria-inteligente');
  storage = await abrirArmazenamento();
});
afterEach(() => {
  vi.restoreAllMocks();
  storage.db.close();
});
it('confirma dependências completas e recupera a mesma revisão', async () => {
  const s = await fixture();
  expect(await confirmarConsulta(storage, s, null, () => true)).toBe('salva');
  expect(await recuperarConsulta(storage)).toEqual(s);
  for (const name of storage.db.objectStoreNames)
    expect(storage.db.transaction(name).store.indexNames.length).toBe(0);
});
it('não repete candidato antigo após conflito e não grava geração superada', async () => {
  expect(await confirmarConsulta(storage, await fixture(), null, () => true)).toBe('salva');
  expect(await confirmarConsulta(storage, await fixture('outra'), null, () => true)).toBe(
    'conflito',
  );
  expect(await confirmarConsulta(storage, await fixture('outra'), 1, () => false)).toBe('memoria');
  expect((await recuperarConsulta(storage))?.consulta.versaoDados).toBe('original');
});
it('pico de coexistência que não cabe mantém fotografia anterior', async () => {
  const first = await fixture();
  await confirmarConsulta(storage, first, null, () => true);
  const s = await fixture('nova');
  storage.limite = calcularBytes([
    { armazem: 'resumos', chave: ['1.0.0', 'nova'], envelope: s.resumo },
    {
      armazem: 'historicos',
      chave: ['1.0.0', 'nova', s.historicos[0]!.perfilId],
      envelope: s.historicos[0],
    },
    { armazem: 'metadados', chave: 'consultaSalva', envelope: s.consulta },
  ]);
  expect(await confirmarConsulta(storage, s, 1, () => true)).toBe('memoria');
  expect(await recuperarConsulta(storage)).toEqual(first);
});
it.each([1, 2, 3])('falha na escrita %i aborta toda a troca', async (failure) => {
  const first = await fixture();
  await confirmarConsulta(storage, first, null, () => true);
  // The extracted native method is invoked with its store receiver via apply.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const original = IDBObjectStore.prototype.put;
  let writes = 0;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
    this: IDBObjectStore,
    ...args: Parameters<IDBObjectStore['put']>
  ) {
    if (++writes === failure) throw new DOMException('Quota', 'QuotaExceededError');
    return original.apply(this, args);
  });
  expect(await confirmarConsulta(storage, await fixture('nova'), 1, () => true)).toBe('memoria');
  expect(await recuperarConsulta(storage)).toEqual(first);
});
it('revisão máxima segura suspende gravação sem reiniciar contador', async () => {
  const s = await fixture();
  s.consulta.revisao = Number.MAX_SAFE_INTEGER;
  s.resumo.ordemUso = Number.MAX_SAFE_INTEGER;
  s.historicos[0]!.ordemUso = Number.MAX_SAFE_INTEGER;
  await storage.db.put('resumos', s.resumo, ['1.0.0', 'original']);
  await storage.db.put('historicos', s.historicos[0]!, [
    '1.0.0',
    'original',
    s.historicos[0]!.perfilId,
  ]);
  await storage.db.put('metadados', s.consulta, 'consultaSalva');
  expect(
    await confirmarConsulta(storage, await fixture('nova'), Number.MAX_SAFE_INTEGER, () => true),
  ).toBe('memoria');
  expect((await recuperarConsulta(storage))?.consulta.revisao).toBe(Number.MAX_SAFE_INTEGER);
});
it.each(['removido', 'corrompido', 'etiqueta', 'filtros', 'dependencias', 'envelope'])(
  'recuperação rejeita %s sem apagar registros',
  async (problem) => {
    const s = await fixture();
    await confirmarConsulta(storage, s, null, () => true);
    if (problem === 'removido')
      await storage.db.delete('historicos', ['1.0.0', 'original', s.historicos[0]!.perfilId]);
    if (problem === 'corrompido') {
      s.resumo.dados.aviso = 'alterado';
      await storage.db.put('resumos', s.resumo, ['1.0.0', 'original']);
    }
    if (problem === 'etiqueta') {
      s.resumo.etag = s.historicos[0]!.etag;
      await storage.db.put('resumos', s.resumo, ['1.0.0', 'original']);
    }
    if (problem === 'filtros') {
      s.consulta.filtros.inicio = '2020-01-01';
      await storage.db.put('metadados', s.consulta, 'consultaSalva');
    }
    if (problem === 'dependencias') {
      s.consulta.perfisHistorico = [];
      await storage.db.put('metadados', s.consulta, 'consultaSalva');
    }
    if (problem === 'envelope') {
      s.historicos[0]!.versaoDados = 'outra';
      await storage.db.put('historicos', s.historicos[0]!, [
        '1.0.0',
        'original',
        s.historicos[0]!.perfilId,
      ]);
    }
    expect(await recuperarConsulta(storage)).toBeNull();
    expect(await storage.db.get('metadados', 'consultaSalva')).toBeDefined();
  },
);
it('restaura etapa resumo e relógio futuro sem inferir sucesso de verificação', async () => {
  const s = await fixture();
  s.consulta.etapa = 'resumo';
  s.consulta.perfisHistorico = [];
  s.historicos = [];
  s.resumo.recebidoEm = '2099-01-01T00:00:00.000Z';
  await storage.db.put('resumos', s.resumo, ['1.0.0', 'original']);
  await storage.db.put('metadados', s.consulta, 'consultaSalva');
  expect(await recuperarConsulta(storage)).toEqual(s);
  expect(await confirmarConsulta(storage, s, 1, () => true)).toBe('memoria');
});
it('limpeza posterior protege atuais e conserva até oito históricos da versão corrente', async () => {
  await confirmarConsulta(storage, await fixture(), null, () => true);
  expect(await confirmarConsulta(storage, await fixture('nova'), 1, () => true)).toBe('salva');
  expect(await storage.db.get('resumos', ['1.0.0', 'original'])).toBeUndefined();
  expect((await recuperarConsulta(storage))?.consulta.revisao).toBe(2);
});

it('limpeza com revisão antiga abandona descarte das dependências da consulta nova', async () => {
  await confirmarConsulta(storage, await fixture(), null, () => true);
  await confirmarConsulta(storage, await fixture('nova'), 1, () => true);
  const extra = await fixture('retida');
  await storage.db.put('resumos', extra.resumo, ['1.0.0', 'retida']);
  await limparArmazenamento(storage, 1);
  expect(await storage.db.get('resumos', ['1.0.0', 'retida'])).toBeDefined();
  expect((await recuperarConsulta(storage))?.consulta.versaoDados).toBe('nova');
});
it('troca de geração durante a última escrita aborta recursos e ponteiro juntos', async () => {
  const first = await fixture();
  await confirmarConsulta(storage, first, null, () => true);
  let current = true;
  // The extracted native method is invoked with its store receiver via apply.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const original = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
    this: IDBObjectStore,
    ...args: Parameters<IDBObjectStore['put']>
  ) {
    const request = original.apply(this, args);
    if (this.name === 'metadados') current = false;
    return request;
  });
  expect(await confirmarConsulta(storage, await fixture('nova'), 1, () => current)).toBe('memoria');
  expect(await recuperarConsulta(storage)).toEqual(first);
});
it('limite exato da primeira fotografia cabe e um byte a menos mantém banco vazio', async () => {
  const s = await fixture();
  const { registrosSnapshot } = await import('./saved-query');
  storage.limite = calcularBytes(registrosSnapshot(s)) - 1;
  expect(await confirmarConsulta(storage, s, null, () => true)).toBe('memoria');
  expect(await recuperarConsulta(storage)).toBeNull();
  storage.limite++;
  expect(await confirmarConsulta(storage, s, null, () => true)).toBe('salva');
  expect(await recuperarConsulta(storage)).toEqual(s);
});
it('dados inválidos ou históricos de período incompletos nunca substituem consulta anterior', async () => {
  const s = await fixture();
  await confirmarConsulta(storage, s, null, () => true);
  const bad = await fixture('nova');
  bad.consulta.filtros = {
    ...bad.consulta.filtros,
    categoria: null,
    sexo: null,
    grupoRacial: null,
    modoTabela: 'periodo',
  };
  expect(await confirmarConsulta(storage, bad, 1, () => true)).toBe('memoria');
  expect(await recuperarConsulta(storage)).toEqual(s);
});

it('período completo confirma os oito históricos necessários e restaura estado vazio contraditório', async () => {
  const { baseFixa } = await import('../../../../packages/domain/src/fixtures');
  const { resourceETag } = await import('../query/client');
  const s = await fixture(baseFixa.resumo.versaoDados);
  s.resumo.dados = baseFixa.resumo;
  s.resumo.etag = await resourceETag('resumo', baseFixa.resumo);
  s.consulta.filtros = {
    ...s.consulta.filtros,
    categoria: null,
    sexo: null,
    grupoRacial: null,
    modoTabela: 'periodo',
  };
  s.historicos = await Promise.all(
    baseFixa.historicos.map(async (dados) => ({
      ...s.resumo,
      perfilId: dados.perfilId,
      dados,
      etag: await resourceETag('historico', dados),
    })),
  );
  s.consulta.perfisHistorico = s.historicos.map((h) => h.perfilId);
  expect(await confirmarConsulta(storage, s, null, () => true)).toBe('salva');
  expect((await recuperarConsulta(storage))?.historicos).toHaveLength(8);
  const empty = await fixture(baseFixa.resumo.versaoDados);
  empty.resumo = s.resumo;
  empty.consulta.filtros.sexo = 'Fêmea';
  empty.consulta.perfilAtivoId = null;
  empty.consulta.perfisHistorico = [];
  empty.historicos = [];
  expect(await confirmarConsulta(storage, empty, 1, () => true)).toBe('salva');
  expect((await recuperarConsulta(storage))?.consulta.perfilAtivoId).toBeNull();
  expect((await recuperarConsulta(storage))?.historicos).toEqual([]);
  expect(await storage.db.count('historicos')).toBe(8);
});

it('confirmações simultâneas da mesma revisão têm uma única vencedora', async () => {
  await confirmarConsulta(storage, await fixture(), null, () => true);
  const [one, two] = await Promise.all([fixture('uma'), fixture('outra')]);
  const results = await Promise.all([
    confirmarConsulta(storage, one, 1, () => true),
    confirmarConsulta(storage, two, 1, () => true),
  ]);
  expect(results.sort()).toEqual(['conflito', 'salva']);
  expect((await recuperarConsulta(storage))?.consulta.revisao).toBe(2);
});
