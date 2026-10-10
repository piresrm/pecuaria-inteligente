import type { Filtros, Historico, Perfil, PrecoRegional, Resumo } from '@pecuaria/contracts/types';
import { adicionarDias, semanasNoIntervalo } from './calendar.js';
import { media, precoPorKg } from './calculations.js';
import { Decimal } from './decimal.js';
import { filtrarConsulta } from './filters.js';
import type {
  Cobertura,
  ConsultaCalculada,
  Indicadores,
  LinhaPreco,
  PontoHistorico,
  Variacao,
} from './types.js';

function cobertura(resumo: Resumo, registros: PrecoRegional[], regiaoId: string | null): Cobertura {
  return {
    disponiveis: registros.length,
    total: regiaoId === null ? resumo.regioes.length : 1,
    regioesPresentes: resumo.regioes
      .filter((r) => registros.some((p) => p.regiaoId === r.id))
      .sort((a, b) => a.ordem - b.ordem)
      .map((r) => r.id),
  };
}
function ponto(
  resumo: Resumo,
  registros: PrecoRegional[],
  perfil: Perfil,
  semana: string,
  regiaoId: string | null,
): PontoHistorico {
  const presentes = registros.filter(
    (p) =>
      p.perfilId === perfil.id &&
      p.semana === semana &&
      (regiaoId === null || p.regiaoId === regiaoId),
  );
  const valor = media(presentes.map((p) => p.preco));
  return {
    semana,
    media: valor,
    precoPorKg: valor === null ? null : precoPorKg(valor, perfil.pesoReferencia),
    cobertura: cobertura(resumo, presentes, regiaoId),
  };
}
function variacao(
  anterior: PontoHistorico | undefined,
  atual: PontoHistorico | undefined,
): Variacao | null {
  if (
    !anterior ||
    !atual ||
    anterior.media === null ||
    atual.media === null ||
    anterior.semana === atual.semana
  )
    return null;
  return {
    absoluta: new Decimal(atual.media).minus(anterior.media).toFixed(),
    percentual: new Decimal(atual.media).div(anterior.media).minus('1').times('100').toFixed(),
    inicio: anterior.semana,
    fim: atual.semana,
    coberturaAnterior: anterior.cobertura,
    coberturaAtual: atual.cobertura,
    composicaoAlterada:
      anterior.cobertura.regioesPresentes.join('|') !== atual.cobertura.regioesPresentes.join('|'),
  };
}
function conferirHistoricos(resumo: Resumo, historicos: Historico[]): Map<string, Historico> {
  const mapa = new Map<string, Historico>();
  const semanasEsperadas = [
    resumo.janela.semanaAnterior,
    ...semanasNoIntervalo(resumo.janela.inicio, resumo.janela.fim),
  ];
  const camposJanela = [
    'inicio',
    'fim',
    'primeiraSemana',
    'ultimaSemana',
    'semanaAnterior',
    'quantidadeSemanasNaJanela',
  ] as const;
  for (const h of historicos) {
    if (
      mapa.has(h.perfilId) ||
      !resumo.perfis.some((p) => p.id === h.perfilId) ||
      h.versaoDados !== resumo.versaoDados ||
      h.conjuntoId !== resumo.conjuntoId ||
      h.publicadoEm !== resumo.publicadoEm ||
      h.schemaVersion !== resumo.schemaVersion ||
      h.versaoTerritorial !== resumo.versaoTerritorial ||
      h.natureza !== resumo.natureza ||
      h.aviso !== resumo.aviso ||
      camposJanela.some((campo) => h.janela[campo] !== resumo.janela[campo]) ||
      h.referenciasSemanais.length !== semanasEsperadas.length ||
      new Set(h.referenciasSemanais.map((r) => r.semana)).size !== semanasEsperadas.length ||
      h.referenciasSemanais.some((r) => !semanasEsperadas.includes(r.semana)) ||
      h.precos.some(
        (p) =>
          p.perfilId !== h.perfilId ||
          p.conjuntoId !== resumo.conjuntoId ||
          p.moeda !== 'BRL' ||
          p.unidadePreco !== 'cabeca' ||
          p.natureza !== 'demonstrativa' ||
          !resumo.regioes.some((r) => r.id === p.regiaoId) ||
          !resumo.condicoesComerciais.some((c) => c.id === p.condicoesComerciaisId),
      ) ||
      h.referenciasSemanais.some((r) => r.perfilId !== h.perfilId)
    )
      throw new TypeError('Histórico incompatível com resumo');
    mapa.set(h.perfilId, h);
  }
  return mapa;
}
export function calcularConsulta(
  resumo: Resumo,
  historicos: Historico[],
  filtros: Filtros,
  perfilAtivoId: string | null,
): ConsultaCalculada {
  const filtragem = filtrarConsulta(resumo, filtros);
  const ativo = filtragem.perfis.find((p) => p.id === perfilAtivoId);
  if (
    (filtragem.perfis.length === 0 && perfilAtivoId !== null) ||
    (filtragem.perfis.length > 0 && !ativo)
  )
    throw new TypeError('Perfil ativo deve pertencer aos perfis elegíveis');
  const mapa = conferirHistoricos(resumo, historicos);
  if (filtros.modoTabela === 'periodo' && filtragem.perfis.some((p) => !mapa.has(p.id)))
    throw new TypeError('Histórico obrigatório para consulta de período');
  const semanas = semanasNoIntervalo(filtragem.inicio, filtragem.fim);
  const linhas: LinhaPreco[] = [];
  let serie: PontoHistorico[] = [];
  let indicadores: Indicadores = {
    perfilId: perfilAtivoId,
    regiaoId: filtragem.regiaoId,
    semana: null,
    media: null,
    precoPorKg: null,
    cobertura: cobertura(resumo, [], filtragem.regiaoId),
    variacaoSemanal: null,
    variacaoPeriodo: null,
  };
  for (const perfil of filtragem.perfis) {
    const historico = mapa.get(perfil.id);
    const registros = historico?.precos ?? resumo.precos;
    const pontos = semanas.map((s) => ponto(resumo, registros, perfil, s, filtragem.regiaoId));
    const disponiveis = pontos.filter((p) => p.media !== null);
    const atual = disponiveis.at(-1);
    const c = atual?.cobertura ?? cobertura(resumo, [], filtragem.regiaoId);
    if (filtragem.regiaoId === null) {
      for (const regiao of [...resumo.regioes].sort((a, b) => a.ordem - b.ordem)) {
        const regional = atual ? ponto(resumo, registros, perfil, atual.semana, regiao.id) : null;
        linhas.push({
          perfilId: perfil.id,
          regiaoId: regiao.id,
          semana: atual?.semana ?? null,
          preco: regional?.media ?? null,
          precoPorKg: regional?.precoPorKg ?? null,
          cobertura: regional?.cobertura ?? cobertura(resumo, [], regiao.id),
        });
      }
    }
    linhas.push({
      perfilId: perfil.id,
      regiaoId: filtragem.regiaoId,
      semana: atual?.semana ?? null,
      preco: atual?.media ?? null,
      precoPorKg: atual?.precoPorKg ?? null,
      cobertura: c,
    });
    if (perfil.id === ativo?.id) {
      serie = historico ? pontos : [];
      const anterior = atual
        ? ponto(resumo, registros, perfil, adicionarDias(atual.semana, -7), filtragem.regiaoId)
        : undefined;
      indicadores = {
        perfilId: perfil.id,
        regiaoId: filtragem.regiaoId,
        semana: atual?.semana ?? null,
        media: atual?.media ?? null,
        precoPorKg: atual?.precoPorKg ?? null,
        cobertura: c,
        variacaoSemanal: variacao(anterior, atual),
        variacaoPeriodo: historico ? variacao(disponiveis[0], atual) : null,
      };
    }
  }
  return { linhas, indicadores, serie };
}
