import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
// A suíte de App verifica coordenação/estados; canvas e assets reais são verificados no navegador.
const chartState = vi.hoisted(() => ({ fail: false }));
vi.mock('./chart/HistoryChart', () => ({
  default: () => {
    if (chartState.fail) throw new Error('Gráfico indisponível no teste de recuperação');
    return <figure aria-label="Gráfico histórico" />;
  },
}));
vi.mock('./components/HeroPicture', () => ({
  default: () => (
    <picture>
      <img alt="" />
    </picture>
  ),
}));
import { App } from './App';
import { QueryCoordinator } from './query/coordinator';
import { assertHistorico, assertResumo } from '@pecuaria/contracts/browser';
it('mantém aviso demonstrativo e estado inicial acessíveis', () => {
  const c = new QueryCoordinator({
    resumo: () => Promise.reject(new Error('rede')),
    historico: () => Promise.reject(new Error('rede')),
  });
  render(<App coordinator={c} />);
  expect(screen.getByRole('heading', { name: 'Pecuária Inteligente' })).toBeVisible();
  expect(document.querySelector('picture')).toBeNull();
  expect(screen.getByText('Dados demonstrativos')).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent('Carregando');
  expect(screen.getByRole('button', { name: 'Verificar atualizações' })).toBeDisabled();
});
it('permite recuperar falha inicial e mantém texto de estado sem alegar resultado inexistente', async () => {
  const { act } = await import('@testing-library/react');
  const c = new QueryCoordinator({
    resumo: () => Promise.reject(new Error('rede')),
    historico: () => Promise.reject(new Error('rede')),
  });
  render(<App coordinator={c} />);
  await act(() => c.iniciar());
  expect(screen.getByRole('button', { name: 'Verificar atualizações' })).toBeEnabled();
  expect(screen.getByRole('status')).toHaveTextContent('Não foi possível carregar a consulta');
  expect(screen.getByRole('status')).not.toHaveTextContent('resultados disponíveis');
});

it('expõe falha de salvamento sem confundir com erro de rede', () => {
  const c = new QueryCoordinator({
    resumo: () => Promise.reject(new Error('rede')),
    historico: () => Promise.reject(new Error('rede')),
  });
  c.state = {
    ...c.state,
    avisoArmazenamento: 'Consulta disponível em memória. Não foi possível salvar estes resultados.',
  };
  render(<App coordinator={c} />);
  expect(
    screen.getByText('Consulta disponível em memória. Não foi possível salvar estes resultados.'),
  ).toBeVisible();
});
it('distingue recuperação salva durante revalidação', () => {
  const c = new QueryCoordinator({
    resumo: () => Promise.reject(new Error('rede')),
    historico: () => Promise.reject(new Error('rede')),
  });
  c.state = { ...c.state, recuperado: true, verificando: true };
  render(<App coordinator={c} />);
  expect(screen.getByRole('status')).toHaveTextContent('Dados salvos — verificando atualização');
});

it('expõe filtros rotulados e limpa para a visão estadual', async () => {
  const { act } = await import('@testing-library/react');
  const { default: userEvent } = await import('@testing-library/user-event');
  const { default: resumo } =
    await import('../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json');
  const { default: historico } =
    await import('../../../docs/superpowers/contracts/v0.1/historico.exemplo.json');
  assertResumo(resumo);
  assertHistorico(historico, resumo, 'bezerro-macho-nelore');
  const meta = {
    etag: 'teste',
    recebidoEm: '2026-10-07T12:00:00.000Z',
    verificadoEm: '2026-10-07T12:00:00.000Z',
  };
  const c = new QueryCoordinator({
    resumo: () => Promise.resolve({ dados: resumo, ...meta }),
    historico: () => Promise.resolve({ dados: historico, ...meta }),
  });
  await act(() => c.iniciar());
  render(<App coordinator={c} />);
  const user = userEvent.setup();
  expect(await screen.findByRole('presentation')).not.toBeNull();
  expect(screen.getByLabelText('Categoria')).toBeEnabled();
  expect(screen.getByLabelText('Sexo')).toBeEnabled();
  expect(screen.getByLabelText('Grupo racial')).toBeEnabled();
  await user.selectOptions(screen.getByLabelText('Região'), 'centro-goiano');
  expect(c.state.solicitado?.filtros.regiaoId).toBe('centro-goiano');
  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(c.state.solicitado?.filtros.regiaoId).toBeNull();
  expect(screen.getByRole('table', { name: /Preços de reposição/ })).toBeVisible();
  expect(screen.getByText('Idade de referência: 12 meses · 240,00 kg de referência')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Variação semanal' })).toBeVisible();
  expect(screen.getByText(/Cobertura regional: \d+ de 10 regiões/)).toBeVisible();
  expect(screen.getByLabelText<HTMLInputElement>('Data inicial').value).toBe('2025-10-01');
  expect(screen.getByLabelText<HTMLInputElement>('Data final').value).toBe('2026-09-30');
});

it('preserva a tabela visível quando o histórico solicitado falha', async () => {
  const { act } = await import('@testing-library/react');
  const { default: resumo } =
    await import('../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json');
  const { default: historico } =
    await import('../../../docs/superpowers/contracts/v0.1/historico.exemplo.json');
  assertResumo(resumo);
  assertHistorico(historico, resumo, 'bezerro-macho-nelore');
  const meta = {
    etag: 'teste',
    recebidoEm: '2026-10-07T12:00:00.000Z',
    verificadoEm: '2026-10-07T12:00:00.000Z',
  };
  let historyCalls = 0;
  const c = new QueryCoordinator({
    resumo: () => Promise.resolve({ dados: resumo, ...meta }),
    historico: () => {
      historyCalls++;
      if (historyCalls > 1) return Promise.reject(new Error('sem conexão'));
      return Promise.resolve({ dados: historico, ...meta });
    },
  });
  await act(() => c.iniciar());
  render(<App coordinator={c} />);
  const previous = screen.getByRole('table', { name: /Preços de reposição/ });
  await act(() =>
    c.consultar(
      { ...c.state.solicitado!.filtros, modoTabela: 'periodo' },
      c.state.solicitado!.perfilAtivoId,
    ),
  );
  expect(screen.getByRole('table', { name: /Preços de reposição/ })).toBe(previous);
  expect(screen.getByRole('status')).toHaveTextContent('resultados disponíveis foram preservados');
  expect(screen.getByRole('button', { name: 'Verificar atualizações' })).toBeEnabled();
});

it('repete somente o gráfico após uma falha e conserva valores textuais e tabela', async () => {
  const { act } = await import('@testing-library/react');
  const { default: userEvent } = await import('@testing-library/user-event');
  const { default: resumo } =
    await import('../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json');
  const { default: historico } =
    await import('../../../docs/superpowers/contracts/v0.1/historico.exemplo.json');
  assertResumo(resumo);
  assertHistorico(historico, resumo, 'bezerro-macho-nelore');
  const meta = {
    etag: 'teste',
    recebidoEm: '2026-10-07T12:00:00.000Z',
    verificadoEm: '2026-10-07T12:00:00.000Z',
  };
  let priceRequests = 0;
  const c = new QueryCoordinator({
    resumo: () => {
      priceRequests++;
      return Promise.resolve({ dados: resumo, ...meta });
    },
    historico: () => {
      priceRequests++;
      return Promise.resolve({ dados: historico, ...meta });
    },
  });
  await act(() => c.iniciar());
  chartState.fail = true;
  const expectedError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(<App coordinator={c} />);
    const retry = await screen.findByRole('button', { name: 'Tentar carregar o gráfico' });
    expect(screen.getByRole('table', { name: /Preços de reposição/ })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Valores do histórico' })).toBeVisible();
    const before = priceRequests;
    chartState.fail = false;
    await userEvent.setup().click(retry);
    expect(await screen.findByRole('figure', { name: 'Gráfico histórico' })).toBeVisible();
    expect(priceRequests).toBe(before);
    expect(expectedError).toHaveBeenCalled();
  } finally {
    chartState.fail = false;
    expectedError.mockRestore();
  }
});

async function consultaParaApresentacao(publicadoEm = '2026-10-07T12:00:00.000Z') {
  const { act } = await import('@testing-library/react');
  const { default: resumoBase } =
    await import('../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json');
  const { default: historicoBase } =
    await import('../../../docs/superpowers/contracts/v0.1/historico.exemplo.json');
  const resumo = { ...resumoBase, publicadoEm };
  assertResumo(resumo);
  const meta = { etag: 'teste', recebidoEm: publicadoEm, verificadoEm: publicadoEm };
  const c = new QueryCoordinator({
    resumo: () => Promise.resolve({ dados: resumo, ...meta }),
    historico: (perfilId) => {
      const precos = resumo.precos.filter((p) => p.perfilId === perfilId);
      const historico = {
        ...historicoBase,
        publicadoEm,
        perfilId,
        precos,
        referenciasSemanais: historicoBase.referenciasSemanais.map((r) => ({
          perfilId,
          semana: r.semana,
          regioesAusentes: resumo.regioes
            .filter(
              (regiao) => !precos.some((p) => p.semana === r.semana && p.regiaoId === regiao.id),
            )
            .map((regiao) => regiao.id),
        })),
      };
      assertHistorico(historico, resumo, perfilId);
      return Promise.resolve({ dados: historico, ...meta });
    },
  });
  await act(() => c.iniciar());
  return c;
}

it('apresenta publicação próxima à meia-noite UTC no dia e horário de Brasília', async () => {
  const c = await consultaParaApresentacao('2026-10-08T01:00:00.000Z');
  render(<App coordinator={c} />);
  expect(screen.getByText(/Publicação:/)).toHaveTextContent(
    'Publicação: 07/10/2026, 22:00 (horário de Brasília)',
  );
  expect(screen.getByLabelText<HTMLInputElement>('Data inicial').value).toBe('2025-10-01');
  expect(screen.getByLabelText<HTMLInputElement>('Data final').value).toBe('2026-09-30');
});

it('distingue idade de referência do perfil e intervalo efetivamente exibido', async () => {
  const { act } = await import('@testing-library/react');
  const c = await consultaParaApresentacao();
  await act(() =>
    c.consultar(
      {
        ...c.state.solicitado!.filtros,
        categoria: 'Garrote',
        sexo: 'Macho',
        grupoRacial: 'Nelore',
        inicio: '2026-09-01',
        fim: '2026-09-30',
        modoTabela: 'periodo',
      },
      'garrote-macho-nelore',
    ),
  );
  expect(c.state.erros).toEqual({});
  expect(c.state.exibido?.perfilAtivoId).toBe('garrote-macho-nelore');
  render(<App coordinator={c} />);
  expect(screen.getByRole('region', { name: 'Histórico semanal' })).toHaveTextContent(
    'Idade de referência: 18 meses',
  );
  expect(screen.getByRole('region', { name: 'Histórico semanal' })).toHaveTextContent(
    '01/09/2026 a 30/09/2026',
  );
  expect(screen.getByRole('region', { name: 'Histórico semanal' })).not.toHaveTextContent(
    '12 meses',
  );
});
