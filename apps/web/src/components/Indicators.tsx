import type { ConsultaCalculada } from '@pecuaria/domain';
import {
  formatarDataCivil,
  formatarPercentual,
  formatarPreco,
} from '@pecuaria/domain/presentation';

function coverage(disponiveis: number, total: number) {
  return `${disponiveis} de ${total} ${total === 1 ? 'região' : 'regiões'}`;
}

export function Indicators({ resultado }: { resultado: ConsultaCalculada }) {
  const { indicadores: i } = resultado;
  const delta = i.variacaoSemanal;
  const sign =
    delta === null
      ? ''
      : Number(delta.absoluta) > 0
        ? 'up'
        : Number(delta.absoluta) < 0
          ? 'down'
          : 'steady';
  return (
    <section className="indicators" aria-labelledby="indicators-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Leitura do perfil ativo</p>
          <h2 id="indicators-title">Indicadores</h2>
        </div>
      </div>
      <div className="indicator-grid">
        <article className="indicator-card indicator-card--lead">
          <h3>Preço médio</h3>
          <p className="indicator-value">
            {formatarPreco(i.media)} <span>/ cabeça</span>
          </p>
          <p>{formatarPreco(i.precoPorKg)} / kg de peso vivo</p>
          <small>
            {i.semana
              ? `Referência de ${formatarDataCivil(i.semana)}`
              : 'Sem preços disponíveis no recorte'}
          </small>
        </article>
        <article className="indicator-card">
          <h3>Variação semanal</h3>
          {delta ? (
            <>
              <p className={`variation variation--${sign}`}>
                {Number(delta.absoluta) > 0 ? '▲' : Number(delta.absoluta) < 0 ? '▼' : '●'}{' '}
                {formatarPercentual(delta.percentual)}
              </p>
              <p>{formatarPreco(delta.absoluta)} por cabeça</p>
              <small>
                {formatarDataCivil(delta.inicio)} → {formatarDataCivil(delta.fim)}
              </small>
              {delta.composicaoAlterada && (
                <small className="tone-warning">A composição regional mudou entre as datas.</small>
              )}
            </>
          ) : (
            <p className="muted">Dados insuficientes para comparar semanas consecutivas.</p>
          )}
        </article>
        <article className="indicator-card">
          <h3>Cobertura regional</h3>
          <p className="indicator-value">{coverage(i.cobertura.disponiveis, i.cobertura.total)}</p>
          <p>
            {i.cobertura.total === 10
              ? 'Média demonstrativa de Goiás, sem ponderação por volume negociado.'
              : 'Preço referente à região selecionada.'}
          </p>
          <small>
            {i.cobertura.regioesPresentes.length
              ? `Dados em: ${i.cobertura.regioesPresentes.length} regiões`
              : 'Nenhuma região com preço neste recorte.'}
          </small>
        </article>
      </div>
      <p className="commercial-note">
        À vista, sem frete nem tributos. A variação compara as semanas informadas; lacunas não são
        preenchidas.
      </p>
      {i.variacaoPeriodo && (
        <p className="period-note">
          No período: {formatarPercentual(i.variacaoPeriodo.percentual)} entre{' '}
          {formatarDataCivil(i.variacaoPeriodo.inicio)} e {formatarDataCivil(i.variacaoPeriodo.fim)}
          .
        </p>
      )}
    </section>
  );
}
