// @vitest-environment node
import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { deleteDB, openDB } from 'idb';
import { BrowserPersistence } from './persistence';
import { abrirArmazenamento } from './database';
import { restaurarFotografia } from './recovery';
import { fixture } from '../../tests/storage-fixtures';
it('adaptador captura revisão, confirma e restaura uma fotografia completa', async () => {
  await deleteDB('pecuaria-inteligente');
  const p = new BrowserPersistence();
  try {
    expect(await p.capturar()).toBeNull();
    const foto = restaurarFotografia(await fixture());
    expect(await p.confirmar(foto, null, () => true)).toBe('salva');
    expect((await p.capturar())?.revisao).toBe(1);
    expect((await p.recuperar())?.resultado).toEqual(foto.resultado);
  } finally {
    p.fechar();
  }
  await expect(p.capturar()).rejects.toThrow('fechado');
});
it('versionchange fecha conexão antiga e versão desconhecida preserva banco', async () => {
  await deleteDB('pecuaria-inteligente');
  const notices: string[] = [];
  const s = await abrirArmazenamento((a) => notices.push(a));
  const next = await openDB('pecuaria-inteligente', 2);
  expect(s.disponivel).toBe(false);
  expect(notices).toHaveLength(1);
  next.close();
  await expect(abrirArmazenamento()).rejects.toThrow();
  const retained = await openDB('pecuaria-inteligente');
  expect(retained.version).toBe(2);
  retained.close();
});
