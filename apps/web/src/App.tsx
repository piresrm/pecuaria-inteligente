import { Component, lazy, Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { formatarDataCivil } from '@pecuaria/domain/presentation';
import type { QueryCoordinator } from './query/coordinator';
import type { Filtros } from '@pecuaria/contracts/types';
import { Hero } from './components/Hero';
import { Filters } from './components/Filters';
import { Indicators } from './components/Indicators';
import { PriceTable } from './components/PriceTable';
import { QueryStatus } from './components/QueryStatus';
import { HistoryTable } from './components/HistoryTable';

const createHistoryChart = () => lazy(() => import('./chart/HistoryChart'));

class ChartFailure extends Component<
  { children: ReactNode; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div role="status" className="chart-error">
        <p>O gráfico não ficou disponível. Os valores continuam na tabela de histórico.</p>
        <button className="button button--outline" type="button" onClick={this.props.onRetry}>
          Tentar carregar o gráfico
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export function App({
  coordinator,
  verificar = () => coordinator.verificar(),
}: {
  coordinator: QueryCoordinator;
  verificar?: () => Promise<void>;
}) {
  const [state, setState] = useState(coordinator.state);
  const [Chart, setChart] = useState(createHistoryChart);
  const [chartRetry, setChartRetry] = useState(0);
  useEffect(() => coordinator.subscribe(setState), [coordinator]);
  const shown = state.exibido;
  const request = Object.keys(state.erros).length ? shown : (state.solicitado ?? shown);
  const clear = () => {
    if (!shown) return;
    const filtros: Filtros = {
      categoria: null,
      sexo: null,
      grupoRacial: null,
      regiaoId: null,
      inicio: shown.resumo.dados.janela.inicio,
      fim: shown.resumo.dados.janela.fim,
      modoTabela: 'recente',
    };
    void coordinator.consultar(filtros, shown.resumo.dados.perfis[0]?.id ?? null);
  };
  return (
    <main className="app-shell">
      <Hero
        pricesAvailable={Boolean(shown?.resultado.linhas.some((line) => line.preco !== null))}
      />
      <div className="content-shell">
        <section className="status-row" aria-label="Estado da consulta">
          <QueryStatus state={state} />
          <button
            className="button button--outline"
            type="button"
            disabled={
              (!shown && Object.keys(state.erros).length === 0) ||
              state.pendente ||
              state.verificando
            }
            onClick={() => {
              void verificar();
            }}
          >
            Verificar atualizações
          </button>
        </section>
        {shown && request && (
          <>
            <Filters
              resumo={shown.resumo.dados}
              filtros={request.filtros}
              perfilAtivoId={request.perfilAtivoId}
              disabled={state.pendente || state.verificando}
              onApply={(filtros, perfil) => {
                void coordinator.consultar(filtros, perfil);
              }}
              onClear={clear}
            />
            <Indicators resultado={shown.resultado} />
            <section className="history-section card" aria-labelledby="history-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    Perfil ativo ·{' '}
                    {shown.resumo.dados.perfis.find((p) => p.id === shown.perfilAtivoId)
                      ?.categoria ?? 'Sem perfil'}
                  </p>
                  <h2 id="history-title">Histórico semanal</h2>
                </div>
                <p>
                  {shown.filtros.modoTabela === 'periodo'
                    ? 'Período selecionado'
                    : 'Últimos 12 meses'}
                </p>
              </div>
              {shown.resumo.dados.perfis.find((p) => p.id === shown.perfilAtivoId) && (
                <p className="history-coverage">
                  12 meses ·{' '}
                  {shown.resumo.dados.perfis
                    .find((p) => p.id === shown.perfilAtivoId)
                    ?.pesoReferencia.replace('.', ',')}{' '}
                  kg de referência
                </p>
              )}
              {shown.etapa === 'completa' && shown.resultado.serie.length > 0 && (
                <ChartFailure
                  key={chartRetry}
                  onRetry={() => {
                    setChart(() => createHistoryChart());
                    setChartRetry((n) => n + 1);
                  }}
                >
                  <Suspense
                    fallback={<p className="chart-loading">Preparando gráfico histórico…</p>}
                  >
                    <Chart pontos={shown.resultado.serie} />
                  </Suspense>
                </ChartFailure>
              )}
              <HistoryTable pontos={shown.resultado.serie} />
              {shown.resultado.serie.length > 0 && (
                <p className="history-coverage">
                  Cobertura regional: {shown.resultado.serie[0]?.cobertura.disponiveis ?? 0} de{' '}
                  {shown.resultado.serie[0]?.cobertura.total ?? 0} regiões. Lacunas não são
                  interpoladas.
                </p>
              )}
            </section>
            <PriceTable resumo={shown.resumo.dados} resultado={shown.resultado} />
            <footer className="page-footer">
              <p>Dados demonstrativos · Goiás</p>
              <p>
                Valores à vista, sem frete nem tributos. Publicação:{' '}
                {formatarDataCivil(shown.resumo.dados.publicadoEm.slice(0, 10))}.
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
