import type { Filtros, Perfil, Resumo } from '@pecuaria/contracts/types';
import { adicionarDias } from './calendar.js';
import type { Filtragem } from './types.js';

export function filtrarPerfis(resumo: Resumo, filtros: Filtros): Perfil[] {
  return resumo.perfis
    .filter(
      (p) =>
        (filtros.categoria === null || filtros.categoria === p.categoria) &&
        (filtros.sexo === null || filtros.sexo === p.sexo) &&
        (filtros.grupoRacial === null || filtros.grupoRacial === p.grupoRacial),
    )
    .sort((a, b) => a.ordem - b.ordem);
}
export function filtrarConsulta(resumo: Resumo, filtros: Filtros): Filtragem {
  adicionarDias(filtros.inicio, 0);
  adicionarDias(filtros.fim, 0);
  if (
    filtros.inicio > filtros.fim ||
    filtros.inicio < resumo.janela.inicio ||
    filtros.fim > resumo.janela.fim ||
    (filtros.modoTabela === 'recente' &&
      (filtros.inicio !== resumo.janela.inicio || filtros.fim !== resumo.janela.fim))
  )
    throw new RangeError('Intervalo fora da janela ou incompatível com modo recente');
  if (filtros.regiaoId !== null && !resumo.regioes.some((r) => r.id === filtros.regiaoId))
    throw new RangeError('Região inexistente');
  return {
    perfis: filtrarPerfis(resumo, filtros),
    inicio: filtros.inicio,
    fim: filtros.fim,
    regiaoId: filtros.regiaoId,
  };
}
