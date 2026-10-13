import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { assertResumo } from '@pecuaria/contracts/browser';
import type { Filtros } from '@pecuaria/contracts/types';
import resumo from '../../../../docs/superpowers/contracts/v0.1/resumo.exemplo.json' with { type: 'json' };
import { Filters } from './Filters';
it('mantém datas inválidas para correção sem consultar e direciona o foco ao campo', async () => {
  assertResumo(resumo);
  const applied: Filtros[] = [];
  const filtros: Filtros = {
    categoria: null,
    sexo: null,
    grupoRacial: null,
    regiaoId: null,
    inicio: resumo.janela.inicio,
    fim: resumo.janela.fim,
    modoTabela: 'recente',
  };
  render(
    <Filters
      resumo={resumo}
      filtros={filtros}
      perfilAtivoId="bezerro-macho-nelore"
      disabled={false}
      onApply={(value) => {
        applied.push(value);
      }}
      onClear={() => {}}
    />,
  );
  const initialDate = screen.getByLabelText('Data inicial');
  fireEvent.change(initialDate, { target: { value: '' } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(applied).toEqual([]);
  expect(initialDate.getAttribute('aria-invalid')).toBe('true');
  expect(initialDate).toBe(document.activeElement);
  expect(screen.getByRole('alert')).toHaveTextContent('Informe uma data inicial');
  fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'Bezerro' } });
  expect(applied).toEqual([]);
  fireEvent.change(initialDate, { target: { value: resumo.janela.inicio } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(applied).toEqual([{ ...filtros, categoria: 'Bezerro' }]);
});
