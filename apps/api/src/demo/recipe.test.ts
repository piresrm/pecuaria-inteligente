import { expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gerarPrecos } from './recipe.js';
import { validarBase } from './validate.js';
import { originalDirectory } from '../../tests/helpers/demo-files.js';

test('reproduz integralmente as linhas ordenadas do CSV, substituições e lacunas', async () => {
  const base = await validarBase(originalDirectory);
  const lines = (await readFile(join(originalDirectory, 'precos.csv'), 'utf8'))
    .trimEnd()
    .split('\n')
    .slice(1);
  const generated = gerarPrecos(base.manifesto, base.perfis, base.regioes, base.receita);
  expect(
    generated.map((p) =>
      [
        p.perfilId,
        p.regiaoId,
        p.semana,
        p.preco,
        p.moeda,
        p.unidadePreco,
        p.natureza,
        p.conjuntoId,
        p.condicoesComerciaisId,
      ].join(','),
    ),
  ).toEqual(lines);
  expect(generated).toHaveLength(4146);
});
test('usa resto não negativo na fórmula mesmo com semente inteira negativa', async () => {
  const base = await validarBase(originalDirectory);
  const recipe = { ...base.receita, semente: -20261007 };
  // -20261007 mod 1501 = 992; noise 242; (340000+2000+242) centavos.
  expect(gerarPrecos(base.manifesto, base.perfis, base.regioes, recipe)[0]?.preco).toBe('3422.42');
});
