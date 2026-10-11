import { useEffect, useState } from 'react';
import { formatarPreco } from '@pecuaria/domain/presentation';
import type { QueryCoordinator } from './query/coordinator';
export function App({
  coordinator,
  verificar = () => coordinator.verificar(),
}: {
  coordinator: QueryCoordinator;
  verificar?: () => Promise<void>;
}) {
  const [state, setState] = useState(coordinator.state);
  useEffect(() => coordinator.subscribe(setState), [coordinator]);
  const price = state.exibido?.resultado.indicadores.media ?? null;
  const status =
    state.erros.resumo || state.erros.consulta || Object.values(state.erros)[0]
      ? state.exibido
        ? 'Não foi possível verificar atualizações. Os resultados disponíveis foram preservados.'
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
    <main>
      <header>
        <p>Reposição em Goiás</p>
        <h1>Pecuária Inteligente</h1>
        <p className="notice">Dados demonstrativos</p>
      </header>
      <section aria-label="Consulta de mercado">
        <p role="status" aria-live="polite">
          {status}
        </p>
        {state.avisoArmazenamento && <p aria-live="polite">{state.avisoArmazenamento}</p>}
        {state.desatualizado && <p>Mais de 15 minutos sem verificar atualizações.</p>}
        <p className="price">
          {price === null ? 'Preço ainda indisponível' : `${formatarPreco(price)} / cabeça`}
        </p>
        <p>À vista, sem frete nem tributos.</p>
        <button
          type="button"
          disabled={
            (!state.exibido && Object.keys(state.erros).length === 0) ||
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
    </main>
  );
}
