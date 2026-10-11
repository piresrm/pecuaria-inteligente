import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ConsultaSalva, HistoricoSalvo, ResumoSalvo } from '@pecuaria/contracts/types';
import { ORCAMENTO_BYTES, type RegistroPersistivel } from './budget';
export interface StorageSchema extends DBSchema {
  resumos: { key: string[]; value: ResumoSalvo };
  historicos: { key: string[]; value: HistoricoSalvo };
  metadados: { key: string; value: ConsultaSalva };
}
export interface StorageHandle {
  db: IDBPDatabase<StorageSchema>;
  limite: number;
  disponivel: boolean;
}
export const STORES = ['resumos', 'historicos', 'metadados'] as const;
export async function abrirArmazenamento(
  onAviso: (aviso: string) => void = () => {},
): Promise<StorageHandle> {
  let handle: StorageHandle | undefined;
  let rejected = false;
  return new Promise((resolve, reject) => {
    void openDB<StorageSchema>('pecuaria-inteligente', 1, {
      upgrade(db) {
        for (const store of STORES) db.createObjectStore(store);
      },
      blocked() {
        rejected = true;
        onAviso('Salvamento impedido por outra aba. Consulta disponível em memória.');
        reject(new Error('Atualização do armazenamento bloqueada'));
      },
      blocking() {
        if (handle) {
          handle.disponivel = false;
          handle.db.close();
        }
        onAviso('Armazenamento fechado para atualização. Consulta disponível em memória.');
      },
      terminated() {
        if (handle) handle.disponivel = false;
        onAviso('Armazenamento interrompido. Consulta disponível em memória.');
      },
    }).then((db) => {
      if (rejected) {
        db.close();
        return;
      }
      handle = { db, limite: ORCAMENTO_BYTES, disponivel: true };
      resolve(handle);
    }, reject);
  });
}
/** One coherent inventory; serialization and budget checks happen after it commits. */
export async function lerRegistros(storage: StorageHandle): Promise<RegistroPersistivel[]> {
  const tx = storage.db.transaction(STORES, 'readonly');
  const done = tx.done;
  void done.catch(() => {});
  const groups = await Promise.all(
    STORES.map(async (armazem) => {
      const store = tx.objectStore(armazem);
      const [keys, values] = await Promise.all([store.getAllKeys(), store.getAll()]);
      return keys.map((chave, i) => ({ armazem, chave, envelope: values[i] }));
    }),
  );
  await done;
  return groups.flat();
}
