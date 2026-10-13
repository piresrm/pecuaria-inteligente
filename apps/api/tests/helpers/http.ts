import type { MercadoRepository } from '../../src/db/repository.js';
import type { AppDependencies } from '../../src/app.js';
import type { Historico, Resumo } from '@pecuaria/contracts/types';
import { assertResumo, assertHistorico } from '@pecuaria/contracts/server';
import resumoExample from '../../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json' with { type: 'json' };
import historicoExample from '../../../../docs/superpowers/contracts/v0.1/historico.exemplo.json' with { type: 'json' };
export function examples(): { resumo: Resumo; historico: Historico } {
  const resumo: unknown = structuredClone(resumoExample);
  const historico: unknown = structuredClone(historicoExample);
  assertResumo(resumo);
  assertHistorico(historico, resumo, 'bezerro-macho-nelore');
  return { resumo, historico };
}
export class MemoryRepository implements MercadoRepository {
  current: string | null;
  summaries = new Map<string, Resumo>();
  histories = new Map<string, Historico>();
  pointerReads = 0;
  summaryReads = 0;
  historyReads = 0;
  constructor() {
    const { resumo, historico } = examples();
    this.current = resumo.versaoDados;
    this.summaries.set(resumo.versaoDados, resumo);
    this.histories.set(`${historico.versaoDados}/${historico.perfilId}`, historico);
  }
  lerVersaoAtual() {
    this.pointerReads++;
    return Promise.resolve(this.current);
  }
  lerResumo(versao: string) {
    this.summaryReads++;
    return Promise.resolve(structuredClone(this.summaries.get(versao) ?? null));
  }
  lerHistorico(versao: string, perfilId: string) {
    this.historyReads++;
    return Promise.resolve(structuredClone(this.histories.get(`${versao}/${perfilId}`) ?? null));
  }
}
// These controls exist exclusively in test utilities. Production must inject T6 controls.
export function permissiveDependencies(repository: MercadoRepository): AppDependencies {
  return { repository, entrada: { verificar() {} }, banco: { run: (operation) => operation() } };
}
export const resumoUrl = '/api/v1/mercado/resumo';
export const historicoUrl = '/api/v1/mercado/historico';
export const versionId = 'go-reposicao-demo-2026-10-07-r1';
export const profileId = 'bezerro-macho-nelore';
export const historyQuery = `perfilId=${profileId}&versaoDados=${versionId}`;
