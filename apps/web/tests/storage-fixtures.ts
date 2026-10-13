import type { Resumo, Historico } from '@pecuaria/contracts/types';
import type { Snapshot } from '../src/storage/saved-query';
import { resourceETag } from '../src/query/client';
import resumoJson from '../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json';
import historicoJson from '../../../docs/superpowers/contracts/v0.1/historico.exemplo.json';
export async function fixture(version = 'original'): Promise<Snapshot> {
  const dados = { ...(resumoJson as Resumo), versaoDados: version };
  const h = { ...(historicoJson as Historico), versaoDados: version };
  const meta = {
    schemaVersion: '1.0.0' as const,
    versaoDados: version,
    recebidoEm: '2026-10-07T12:00:00.000Z',
    verificadoEm: '2026-10-07T12:00:00.000Z',
    ordemUso: 1,
  };
  return {
    resumo: { ...meta, dados, etag: await resourceETag('resumo', dados) },
    historicos: [
      { ...meta, perfilId: h.perfilId, dados: h, etag: await resourceETag('historico', h) },
    ],
    consulta: {
      chave: 'consultaSalva',
      schemaVersion: '1.0.0',
      versaoDados: version,
      revisao: 1,
      etapa: 'completa',
      filtros: {
        categoria: 'Bezerro',
        sexo: 'Macho',
        grupoRacial: 'Nelore',
        regiaoId: null,
        inicio: dados.janela.inicio,
        fim: dados.janela.fim,
        modoTabela: 'recente',
      },
      perfilAtivoId: h.perfilId,
      perfisHistorico: [h.perfilId],
    },
  };
}
