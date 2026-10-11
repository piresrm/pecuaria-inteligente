import { assertHistorico, assertResumo, validators } from '@pecuaria/contracts/browser';
import type { ConsultaSalva, HistoricoSalvo, Perfil, ResumoSalvo } from '@pecuaria/contracts/types';
import { filtrarConsulta } from '@pecuaria/domain';
import { resourceETag } from '../query/client';
import type { Fotografia } from '../query/state';
import {
  cabeNoOrcamento,
  mesclarRegistros,
  ordenarDescarte,
  type RegistroPersistivel,
} from './budget';
import { lerRegistros, STORES, type StorageHandle } from './database';
export interface Snapshot {
  resumo: ResumoSalvo;
  historicos: HistoricoSalvo[];
  consulta: ConsultaSalva;
}
function ensure(value: unknown): asserts value {
  if (!value) throw new TypeError('Consulta salva inválida');
}
function perfil(id: string): Perfil['id'] {
  ensure(validators.PerfilId(id));
  return id as Perfil['id'];
}
export function criarSnapshot(foto: Fotografia, revisao: number): Snapshot {
  const version = foto.resumo.dados.versaoDados;
  const meta = { schemaVersion: '1.0.0' as const, versaoDados: version, ordemUso: revisao };
  return {
    resumo: { ...meta, ...foto.resumo },
    historicos: Object.entries(foto.historicos).map(([perfilId, h]) => ({
      ...meta,
      perfilId: perfil(perfilId),
      ...h,
    })),
    consulta: {
      chave: 'consultaSalva',
      schemaVersion: '1.0.0',
      versaoDados: version,
      revisao,
      etapa: foto.etapa,
      filtros: { ...foto.filtros },
      perfilAtivoId: foto.perfilAtivoId === null ? null : perfil(foto.perfilAtivoId),
      perfisHistorico: Object.keys(foto.historicos).map(perfil),
    },
  };
}
/** Contract, dependencies, semantic body and hashes are checked outside any transaction. */
export async function validarSnapshot(snapshot: Snapshot): Promise<void> {
  const { consulta: c, resumo: r, historicos: hs } = snapshot;
  ensure(validators.ConsultaSalva(c) && validators.ResumoSalvo(r));
  assertResumo(r.dados);
  ensure(
    c.schemaVersion === r.schemaVersion &&
      c.versaoDados === r.versaoDados &&
      r.versaoDados === r.dados.versaoDados,
  );
  ensure(r.ordemUso === c.revisao);
  const eligible = filtrarConsulta(r.dados, c.filtros).perfis.map((p) => p.id);
  ensure(
    eligible.length === 0
      ? c.perfilAtivoId === null
      : c.perfilAtivoId !== null && eligible.includes(c.perfilAtivoId),
  );
  const needed =
    c.etapa === 'resumo'
      ? []
      : c.filtros.modoTabela === 'periodo'
        ? eligible
        : c.perfilAtivoId
          ? [c.perfilAtivoId]
          : [];
  ensure(c.etapa !== 'resumo' || c.filtros.modoTabela === 'recente');
  ensure(
    c.perfisHistorico.length === needed.length &&
      needed.every((id) => c.perfisHistorico.includes(id)),
  );
  ensure(hs.length === needed.length && new Set(hs.map((h) => h.perfilId)).size === hs.length);
  ensure(r.etag === (await resourceETag('resumo', r.dados)));
  for (const h of hs) {
    ensure(validators.HistoricoSalvo(h) && needed.includes(h.perfilId));
    ensure(
      h.schemaVersion === c.schemaVersion &&
        h.versaoDados === c.versaoDados &&
        h.ordemUso === c.revisao,
    );
    assertHistorico(h.dados, r.dados, h.perfilId);
    ensure(h.etag === (await resourceETag('historico', h.dados)));
  }
}
export function registrosSnapshot(s: Snapshot): RegistroPersistivel[] {
  return [
    {
      armazem: 'resumos',
      chave: [s.resumo.schemaVersion, s.resumo.versaoDados],
      envelope: s.resumo,
    },
    ...s.historicos.map((h) => ({
      armazem: 'historicos' as const,
      chave: [h.schemaVersion, h.versaoDados, h.perfilId],
      envelope: h,
    })),
    { armazem: 'metadados', chave: 'consultaSalva', envelope: s.consulta },
  ];
}
export async function confirmarConsulta(
  storage: StorageHandle,
  snapshot: Snapshot,
  revisaoEsperada: number | null,
  geracaoAtual: () => boolean,
): Promise<'salva' | 'conflito' | 'memoria'> {
  if (snapshot.consulta.etapa !== 'completa' || !storage.disponivel || !geracaoAtual())
    return 'memoria';
  if (
    revisaoEsperada !== null &&
    (!Number.isSafeInteger(revisaoEsperada) ||
      revisaoEsperada < 1 ||
      revisaoEsperada === Number.MAX_SAFE_INTEGER)
  )
    return 'memoria';
  const revisao = (revisaoEsperada ?? 0) + 1;
  // Own a clone: caller changes cannot slip between asynchronous validation and writes.
  const candidate = structuredClone(snapshot);
  candidate.consulta.revisao = revisao;
  candidate.resumo.ordemUso = revisao;
  for (const h of candidate.historicos) h.ordemUso = revisao;
  try {
    await validarSnapshot(candidate);
    const existing = await lerRegistros(storage);
    const saved = existing.find(
      (r) => r.armazem === 'metadados' && r.chave === 'consultaSalva',
    )?.envelope;
    if (saved !== undefined && !validators.ConsultaSalva(saved)) return 'memoria';
    const captured = saved as ConsultaSalva | undefined;
    if ((captured?.revisao ?? null) !== revisaoEsperada) return 'conflito';
    const prepared = mesclarRegistros(existing, registrosSnapshot(candidate));
    // Count coexistence before cleanup. Never delete the previous snapshot to fit.
    if (!cabeNoOrcamento(prepared, storage.limite)) return 'memoria';
    const tx = storage.db.transaction(STORES, 'readwrite');
    const done = tx.done;
    void done.catch(() => {});
    try {
      const pointer = await tx.objectStore('metadados').get('consultaSalva');
      if ((pointer?.revisao ?? null) !== revisaoEsperada) {
        tx.abort();
        await done.catch(() => {});
        return 'conflito';
      }
      if (!geracaoAtual()) {
        tx.abort();
        await done.catch(() => {});
        return 'memoria';
      }
      await tx
        .objectStore('resumos')
        .put(candidate.resumo, [candidate.resumo.schemaVersion, candidate.resumo.versaoDados]);
      for (const h of candidate.historicos)
        await tx.objectStore('historicos').put(h, [h.schemaVersion, h.versaoDados, h.perfilId]);
      await tx.objectStore('metadados').put(candidate.consulta, 'consultaSalva');
      if (!geracaoAtual()) {
        tx.abort();
        await done.catch(() => {});
        return 'memoria';
      }
      await done;
    } catch {
      try {
        tx.abort();
      } catch {
        /* Already finished. */
      }
      await done.catch(() => {});
      return 'memoria';
    }
    // Cleanup failure cannot revoke a transaction already committed.
    await limparArmazenamento(storage, revisao).catch(() => {});
    return 'salva';
  } catch {
    return 'memoria';
  }
}
export async function limparArmazenamento(storage: StorageHandle, revisao: number): Promise<void> {
  const tx = storage.db.transaction(STORES, 'readwrite');
  const done = tx.done;
  void done.catch(() => {});
  try {
    const c = await tx.objectStore('metadados').get('consultaSalva');
    if (!c || c.revisao !== revisao) {
      await done;
      return;
    }
    const resumoKeys = await tx.objectStore('resumos').getAllKeys();
    const historyStore = tx.objectStore('historicos');
    const [keys, histories] = await Promise.all([historyStore.getAllKeys(), historyStore.getAll()]);
    const candidates = ordenarDescarte(
      keys.flatMap((key, i) => {
        const h = histories[i];
        return h ? [{ key, perfilId: h.perfilId, ordemUso: h.ordemUso }] : [];
      }),
    );
    for (const h of candidates) {
      const currentVersion = h.key[0] === c.schemaVersion && h.key[1] === c.versaoDados;
      const protectedHistory = currentVersion && c.perfisHistorico.some((id) => id === h.key[2]);
      if (!currentVersion && !protectedHistory) await historyStore.delete(h.key);
    }
    for (const key of resumoKeys)
      if (key[0] !== c.schemaVersion || key[1] !== c.versaoDados)
        await tx.objectStore('resumos').delete(key);
    await done;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* Already finished. */
    }
    await done.catch(() => {});
    throw error;
  }
}
