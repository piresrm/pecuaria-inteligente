import { deleteDB, openDB } from 'idb';
import { abrirArmazenamento, type StorageHandle } from '../src/storage/database';
import { confirmarConsulta, limparArmazenamento } from '../src/storage/saved-query';
import { recuperarConsulta } from '../src/storage/recovery';
import { fixture } from './storage-fixtures';
let handle: StorageHandle | undefined;
let restore: (() => void) | undefined;
const aviso: string[] = [];
async function get() {
  return (handle ??= await abrirArmazenamento((a) => aviso.push(a)));
}
const harness = {
  async reset() {
    restore?.();
    restore = undefined;
    handle?.db.close();
    handle = undefined;
    await deleteDB('pecuaria-inteligente');
  },
  async save(version: string, revision: number | null, current = true) {
    return confirmarConsulta(await get(), await fixture(version), revision, () => current);
  },
  async read() {
    return recuperarConsulta(await get());
  },
  async capture() {
    return (await (await get()).db.get('metadados', 'consultaSalva'))?.revisao ?? null;
  },
  async close() {
    (await get()).db.close();
  },
  fault(at: number, kind: 'quota' | 'abort') {
    // Test-only injection preserves the receiver with apply.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const put = IDBObjectStore.prototype.put;
    let writes = 0;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (++writes === at) {
        if (kind === 'quota') throw new DOMException('Quota simulada', 'QuotaExceededError');
        this.transaction.abort();
      }
      return put.apply(this, args);
    };
    restore = () => {
      IDBObjectStore.prototype.put = put;
    };
  },
  release() {
    restore?.();
    restore = undefined;
  },
  async corrupt(kind: 'missing' | 'hash' | 'summary' | 'future') {
    const h = await get();
    const s = (await recuperarConsulta(h))!;
    if (kind === 'missing')
      await h.db.delete('historicos', ['1.0.0', s.consulta.versaoDados, s.historicos[0]!.perfilId]);
    if (kind === 'hash') {
      s.resumo.etag = s.historicos[0]!.etag;
      await h.db.put('resumos', s.resumo, ['1.0.0', s.consulta.versaoDados]);
    }
    if (kind === 'summary') {
      s.consulta.etapa = 'resumo';
      s.consulta.perfisHistorico = [];
      await h.db.put('metadados', s.consulta, 'consultaSalva');
    }
    if (kind === 'future') {
      s.resumo.recebidoEm = '2099-01-01T00:00:00.000Z';
      await h.db.put('resumos', s.resumo, ['1.0.0', s.consulta.versaoDados]);
    }
  },
  async cleanup(revision: number) {
    await limparArmazenamento(await get(), revision);
  },
  async rawVersion() {
    return (await (await get()).db.get('metadados', 'consultaSalva'))?.versaoDados;
  },
  async budget(bytes: number) {
    (await get()).limite = bytes;
  },
  async blockedMigration() {
    const h = await get();
    h.db.close();
    handle = undefined;
    const blocker = await openDB('pecuaria-inteligente', 1);
    let blocked = false;
    const next = await openDB('pecuaria-inteligente', 2, {
      blocked() {
        blocked = true;
        blocker.close();
      },
    });
    next.close();
    return blocked;
  },
  notices() {
    return aviso;
  },
};
declare global {
  interface Window {
    storageHarness: typeof harness;
  }
}
window.storageHarness = harness;
