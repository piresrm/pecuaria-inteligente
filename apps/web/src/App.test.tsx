import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { QueryCoordinator } from './query/coordinator';
it('mantém aviso demonstrativo e estado inicial acessíveis', () => {
  const c = new QueryCoordinator({
    resumo: () => Promise.reject(new Error('rede')),
    historico: () => Promise.reject(new Error('rede')),
  });
  render(<App coordinator={c} />);
  expect(screen.getByRole('heading', { name: 'Pecuária Inteligente' })).toBeVisible();
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
