import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const nomesArquivos = [
  'cenarios.json',
  'manifesto.json',
  'perfis.json',
  'precos.csv',
  'receita.json',
  'regioes.json',
] as const;
export type NomeArquivo = (typeof nomesArquivos)[number];
export interface ArquivosLidos {
  arquivos: Record<NomeArquivo, string>;
  hashes: Record<NomeArquivo, string>;
  hashConjuntoSha256: string;
}
export const cabecalhoPrecos = [
  'perfilId',
  'regiaoId',
  'semana',
  'preco',
  'moeda',
  'unidadePreco',
  'natureza',
  'conjuntoId',
  'condicoesComerciaisId',
] as const;
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export async function lerArquivos(diretorio: string): Promise<ArquivosLidos> {
  const sums = await readFile(join(diretorio, 'SHA256SUMS'));
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
  const text = decoder.decode(sums);
  const lines = text.endsWith('\n') ? text.slice(0, -1).split('\n') : [];
  if (lines.length !== nomesArquivos.length) throw new Error('SHA-256 incompletos');
  const hashes = {} as Record<NomeArquivo, string>;
  for (const line of lines) {
    const match = /^([a-f0-9]{64}) {2}([a-z.]+)$/.exec(line);
    const name = match?.[2];
    if (!name || !nomesArquivos.includes(name as NomeArquivo) || name in hashes)
      throw new Error('SHA-256 inválido');
    hashes[name as NomeArquivo] = match[1]!;
  }
  const entries = await Promise.all(
    nomesArquivos.map(async (name) => {
      const bytes = await readFile(join(diretorio, name));
      if (sha256(bytes) !== hashes[name]) throw new Error(`SHA-256 divergente: ${name}`);
      const contents = decoder.decode(bytes);
      if (!contents.endsWith('\n') || contents.includes('\r') || contents.startsWith('\uFEFF'))
        throw new Error(`Serialização UTF-8/LF inválida: ${name}`);
      return [name, contents] as const;
    }),
  );
  return {
    arquivos: Object.fromEntries(entries) as Record<NomeArquivo, string>,
    hashes,
    hashConjuntoSha256: sha256(sums),
  };
}

// The approved CSV has nine plain fields, no quoting or embedded commas.
// Reject alternate dialects instead of silently interpreting them.
export function lerPrecos(csv: string): Record<(typeof cabecalhoPrecos)[number], string>[] {
  const [header, ...lines] = csv.slice(0, -1).split('\n');
  if (header !== cabecalhoPrecos.join(',')) throw new Error('Cabeçalho CSV inválido');
  return lines.map((line) => {
    const fields = line.split(',');
    if (
      fields.length !== cabecalhoPrecos.length ||
      fields.some((value) => !value || /["\r\n]/.test(value))
    )
      throw new Error('Registro CSV inválido');
    return Object.fromEntries(
      cabecalhoPrecos.map((name, index) => [name, fields[index]!]),
    ) as Record<(typeof cabecalhoPrecos)[number], string>;
  });
}
