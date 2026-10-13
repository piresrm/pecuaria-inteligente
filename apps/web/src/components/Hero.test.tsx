import { expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Hero } from './Hero';
vi.mock('./HeroPicture', () => ({
  default: () => {
    throw new Error('Fotografia indisponível');
  },
}));

it('mantém descrição e aviso se o módulo decorativo falha depois dos preços', async () => {
  const expectedError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(<Hero pricesAvailable />);
    await waitFor(() => expect(expectedError).toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: 'Pecuária Inteligente' })).toBeVisible();
    expect(screen.getByText('Dados demonstrativos')).toBeVisible();
  } finally {
    expectedError.mockRestore();
  }
});
