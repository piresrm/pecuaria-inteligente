// @vitest-environment node
import { expect, it } from 'vitest';
import { calcularBytes, cabeNoOrcamento, mesclarRegistros, ordenarDescarte } from './budget';
const record = (chave: string, envelope: unknown) => ({
  armazem: 'historicos' as const,
  chave,
  envelope,
});
it('conta chaves e valores compactos em UTF-8 incluindo acentos', () => {
  expect(calcularBytes([record('á', { nome: 'São' })])).toBe(19);
});
it('substitui a mesma chave sem duplicar e preserva versões diferentes e referência única', () => {
  const old = [
    record('v1', 'antigo'),
    { armazem: 'metadados' as const, chave: 'consultaSalva', envelope: 1 },
  ];
  const merged = mesclarRegistros(old, [
    record('v1', 'novo'),
    record('v2', 'outro'),
    { armazem: 'metadados' as const, chave: 'consultaSalva', envelope: 2 },
  ]);
  expect(merged).toHaveLength(3);
  expect(merged.map((r) => r.envelope)).toEqual(['novo', 2, 'outro']);
});
it('aceita exatamente o limite e rejeita mais um byte', () => {
  const records = [record('a', 'b')];
  expect(cabeNoOrcamento(records, 6)).toBe(true);
  expect(cabeNoOrcamento(records, 5)).toBe(false);
});
it('descarte menos usado desempata por perfilId sem relógio', () => {
  expect(
    ordenarDescarte([
      { perfilId: 'z', ordemUso: 1 },
      { perfilId: 'a', ordemUso: 1 },
      { perfilId: 'b', ordemUso: 2 },
    ]).map((r) => r.perfilId),
  ).toEqual(['a', 'z', 'b']);
});
