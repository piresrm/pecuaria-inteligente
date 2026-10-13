import { ConsultaSalva as validarConsultaSalva } from '@pecuaria/contracts/browser';
import { calcularConsulta } from '@pecuaria/domain';
import type { Fotografia } from '../query/state';
import { STORES, type StorageHandle } from './database';
import { validarSnapshot, type Snapshot } from './saved-query';
export async function recuperarConsulta(storage: StorageHandle): Promise<Snapshot | null> {
  try {
    const tx = storage.db.transaction(STORES, 'readonly');
    const done = tx.done;
    void done.catch(() => {});
    const c = await tx.objectStore('metadados').get('consultaSalva');
    // Shape only: keep malformed keys from crashing reads. Full validation follows commit.
    if (
      !c ||
      typeof c.schemaVersion !== 'string' ||
      typeof c.versaoDados !== 'string' ||
      !Array.isArray(c.perfisHistorico) ||
      !c.perfisHistorico.every((id) => typeof id === 'string')
    ) {
      await done;
      return null;
    }
    const [r, hs] = await Promise.all([
      tx.objectStore('resumos').get([c.schemaVersion, c.versaoDados]),
      Promise.all(
        c.perfisHistorico.map((id) =>
          tx.objectStore('historicos').get([c.schemaVersion, c.versaoDados, id]),
        ),
      ),
    ]);
    await done;
    if (!r || hs.some((h) => !h) || !validarConsultaSalva(c)) return null;
    const s: Snapshot = { consulta: c, resumo: r, historicos: hs.filter((h) => h !== undefined) };
    // Reads used pointer keys, and validation checks every identity against that pointer.
    await validarSnapshot(s);
    return s;
  } catch {
    return null;
  }
}
export function restaurarFotografia(s: Snapshot): Fotografia {
  const historicos = Object.fromEntries(s.historicos.map((h) => [h.perfilId, h]));
  return {
    filtros: s.consulta.filtros,
    perfilAtivoId: s.consulta.perfilAtivoId,
    resumo: s.resumo,
    historicos,
    etapa: s.consulta.etapa,
    resultado: calcularConsulta(
      s.resumo.dados,
      s.historicos.map((h) => h.dados),
      s.consulta.filtros,
      s.consulta.perfilAtivoId,
    ),
  };
}
