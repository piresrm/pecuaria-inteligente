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
  closeDuringWrite() {
    // The connection closes while the transaction is active; abort models its interruption.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const put = IDBObjectStore.prototype.put;
    let interrupted = false;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (!interrupted) {
        interrupted = true;
        handle!.db.close();
        this.transaction.abort();
      }
      return put.apply(this, args);
    };
    restore = () => {
      IDBObjectStore.prototype.put = put;
    };
  },
  async readWhileWriting() {
    const h = await get();
    const candidate = await fixture('nova');
    candidate.consulta.revisao = 2;
    candidate.resumo.ordemUso = 2;
    for (const history of candidate.historicos) history.ordemUso = 2;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const nativeGet = IDBObjectStore.prototype.get;
    let startWrite!: () => void;
    const writerStarted = new Promise<void>((resolve) => {
      startWrite = resolve;
    });
    let writer: Promise<void> | undefined;
    let queuedBetweenReads = false;
    IDBObjectStore.prototype.get = function (...args: Parameters<IDBObjectStore['get']>) {
      const request = nativeGet.apply(this, args);
      if (this.name === 'metadados' && !writer) {
        request.addEventListener(
          'success',
          () => {
            const tx = h.db.transaction(['metadados', 'resumos', 'historicos'], 'readwrite');
            writer = tx.done;
            void writer.catch(() => {});
            const original = request.result as { versaoDados: string };
            void tx.objectStore('resumos').put(candidate.resumo, ['1.0.0', 'nova']);
            for (const history of candidate.historicos) {
              void tx.objectStore('historicos').put(history, ['1.0.0', 'nova', history.perfilId]);
              void tx
                .objectStore('historicos')
                .delete(['1.0.0', original.versaoDados, history.perfilId]);
            }
            void tx.objectStore('metadados').put(candidate.consulta, 'consultaSalva');
            void tx.objectStore('resumos').delete(['1.0.0', original.versaoDados]);
            startWrite();
          },
          { once: true },
        );
      } else if (this.name === 'resumos' && writer) queuedBetweenReads = true;
      return request;
    };
    try {
      const snapshot = await recuperarConsulta(h);
      await writerStarted;
      await writer;
      return { snapshot, queuedBetweenReads, after: await recuperarConsulta(h) };
    } finally {
      IDBObjectStore.prototype.get = nativeGet;
    }
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
