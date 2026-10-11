export interface RegistroPersistivel {
  armazem: 'resumos' | 'historicos' | 'metadados';
  chave: string | string[];
  envelope: unknown;
}
export const ORCAMENTO_BYTES = 10_485_760;
export function calcularBytes(registros: RegistroPersistivel[]): number {
  const encoder = new TextEncoder();
  return registros.reduce(
    (total, r) =>
      total +
      encoder.encode(JSON.stringify(r.chave)).byteLength +
      encoder.encode(JSON.stringify(r.envelope)).byteLength,
    0,
  );
}
export function cabeNoOrcamento(
  registros: RegistroPersistivel[],
  limite = ORCAMENTO_BYTES,
): boolean {
  return calcularBytes(registros) <= limite;
}
export function mesclarRegistros(
  existentes: RegistroPersistivel[],
  novos: RegistroPersistivel[],
): RegistroPersistivel[] {
  const map = new Map<string, RegistroPersistivel>();
  for (const r of [...existentes, ...novos]) map.set(JSON.stringify([r.armazem, r.chave]), r);
  return [...map.values()];
}
export function ordenarDescarte<T extends { perfilId: string; ordemUso: number }>(
  registros: T[],
): T[] {
  return [...registros].sort(
    (a, b) =>
      a.ordemUso - b.ordemUso || (a.perfilId < b.perfilId ? -1 : a.perfilId > b.perfilId ? 1 : 0),
  );
}
