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
