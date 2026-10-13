import type { QueryState } from '../query/state';

export function QueryStatus({ state }: { state: QueryState }) {
  const hasError = Object.keys(state.erros).length > 0;
  const visible = state.exibido;
  const summary = visible?.resumo.dados;
  const profile = summary?.perfis.find((p) => p.id === visible?.perfilAtivoId);
  const region = summary?.regioes.find((r) => r.id === visible?.filtros.regiaoId);
  const status = hasError
    ? state.exibido
      ? 'Não foi possível atualizar o recorte solicitado. Os resultados disponíveis foram preservados.'
      : 'Não foi possível carregar a consulta. Tente verificar novamente.'
    : state.recuperado && state.verificando
      ? 'Dados salvos — verificando atualização'
      : state.pendente || state.verificando
        ? 'Carregando consulta…'
        : state.etapa === 'resumo'
          ? 'Resumo disponível. Histórico ainda carregando.'
          : state.exibido
            ? 'Consulta disponível.'
            : 'Carregando consulta…';
  return (
    <div className="query-status">
      <p role="status" aria-live="polite" className={hasError ? 'tone-warning' : undefined}>
        {status}
      </p>
      {(hasError || state.pendente) && visible && (
        <p className="query-status__visible">
          Recorte exibido:{' '}
          {profile
            ? `${profile.categoria}, ${profile.sexo}, ${profile.grupoRacial}`
            : 'todos os perfis'}{' '}
          · {region?.nome ?? 'Todo o estado — Goiás'} · {visible.filtros.inicio} a{' '}
          {visible.filtros.fim}.
        </p>
      )}
      {state.desatualizado && (
        <p className="tone-warning">Mais de 15 minutos sem verificar atualizações.</p>
      )}
      {state.avisoArmazenamento && (
        <p role="status" className="tone-warning">
          {state.avisoArmazenamento}
        </p>
      )}
    </div>
  );
}
