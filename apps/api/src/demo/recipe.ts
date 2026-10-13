import type { Perfil, PrecoRegional } from '@pecuaria/contracts/types';
import { validators } from '@pecuaria/contracts/server';
import type { Manifesto, RegiaoArquivo } from './validate.js';

interface Combinacao {
  semana: string;
  perfilId: string;
  regiaoId: string;
}
export interface Receita {
  versaoReceita: '1';
  semente: number;
  indiceInicial: 0;
  semanas: string[];
  basesCentavos: number[];
  incrementosSemanaisCentavos: number[];
  deslocamentosRegionaisCentavos: number[];
  cicloCentavos: number[];
  formulaRuido: string;
  formulaPrecoCentavos: string;
  lacunas: (Combinacao & { motivo: string })[];
  substituicoes: (Combinacao & { preco: string })[];
}
function ensure(condition: unknown, message = 'Receita inválida'): asserts condition {
  if (!condition) throw new Error(message);
}
function record(value: unknown): asserts value is Record<string, unknown> {
  ensure(value !== null && typeof value === 'object' && !Array.isArray(value));
}
export function validarReceita(
  value: unknown,
  weeks: string[],
  profiles: Perfil[],
  regions: RegiaoArquivo[],
): asserts value is Receita {
  record(value);
  ensure(
    value.versaoReceita === '1' && value.indiceInicial === 0 && Number.isSafeInteger(value.semente),
  );
  ensure(
    Array.isArray(value.semanas) && JSON.stringify(value.semanas) === JSON.stringify(weeks),
    'Receita: calendário divergente',
  );
  for (const [name, length] of [
    ['basesCentavos', 8],
    ['incrementosSemanaisCentavos', 8],
    ['deslocamentosRegionaisCentavos', 10],
    ['cicloCentavos', 12],
  ] as const) {
    const items = value[name];
    ensure(
      Array.isArray(items) && items.length === length && items.every(Number.isSafeInteger),
      'Receita: parâmetros inteiros inválidos',
    );
  }
  ensure(value.formulaRuido === '((semente + 31*p + 17*r + 13*s + 7*s*s) % 1501) - 750');
  ensure(
    value.formulaPrecoCentavos ===
      'basesCentavos[p] + incrementosSemanaisCentavos[p]*s + deslocamentosRegionaisCentavos[r] + cicloCentavos[(s // 4) % 12] + ruido',
  );
  ensure(
    value.ordemPerfis === 'ordem de perfis.json, menos um' &&
      value.ordemRegioes === 'ordem de regioes.json, menos um',
  );
  ensure(
    JSON.stringify(value.ordemOperacoes) ===
      JSON.stringify([
        'calcular preço em centavos inteiros',
        'aplicar substituição explícita, se houver',
        'omitir combinações listadas nas lacunas',
        'serializar na ordem semana, perfil, região',
      ]),
  );
  for (const name of ['lacunas', 'substituicoes'] as const) {
    const items = value[name];
    ensure(Array.isArray(items));
    const keys = new Set<string>();
    for (const item of items) {
      record(item);
      ensure(typeof item.semana === 'string' && weeks.includes(item.semana));
      const wildcard = name === 'lacunas';
      ensure(profiles.some((p) => p.id === item.perfilId) || (wildcard && item.perfilId === '*'));
      ensure(regions.some((r) => r.id === item.regiaoId) || (wildcard && item.regiaoId === '*'));
      const key = JSON.stringify([item.semana, item.perfilId, item.regiaoId]);
      ensure(!keys.has(key), 'Receita: combinação duplicada');
      keys.add(key);
      if (wildcard) ensure(typeof item.motivo === 'string' && item.motivo.trim().length > 0);
      else ensure(validators.Preco(item.preco), 'Receita: preço decimal inválido');
    }
  }
}
const key = (week: string, profile: string, region: string) => `${week}|${profile}|${region}`;
export function gerarPrecos(
  manifesto: Manifesto,
  perfis: Perfil[],
  regioes: RegiaoArquivo[],
  receita: Receita,
): PrecoRegional[] {
  const replacements = new Map(
    receita.substituicoes.map((s) => [key(s.semana, s.perfilId, s.regiaoId), s.preco]),
  );
  const omitted = new Set<string>();
  for (const gap of receita.lacunas)
    for (const profile of perfis.filter((p) => gap.perfilId === '*' || p.id === gap.perfilId))
      for (const region of regioes.filter((r) => gap.regiaoId === '*' || r.id === gap.regiaoId))
        omitted.add(key(gap.semana, profile.id, region.id));
  const result: PrecoRegional[] = [];
  for (const [s, semana] of receita.semanas.entries()) {
    const week = BigInt(s);
    for (const [p, profile] of perfis.entries()) {
      for (const [r, region] of regioes.entries()) {
        const identity = key(semana, profile.id, region.id);
        if (omitted.has(identity)) continue;
        const dividend =
          BigInt(receita.semente) +
          31n * BigInt(p) +
          17n * BigInt(r) +
          13n * week +
          7n * week * week;
        const noise = (((dividend % 1501n) + 1501n) % 1501n) - 750n;
        const cents =
          BigInt(receita.basesCentavos[p]!) +
          BigInt(receita.incrementosSemanaisCentavos[p]!) * week +
          BigInt(receita.deslocamentosRegionaisCentavos[r]!) +
          BigInt(receita.cicloCentavos[Math.floor(s / 4) % 12]!) +
          noise;
        const price =
          replacements.get(identity) ?? `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
        ensure(validators.Preco(price), 'Receita: preço decimal inválido');
        result.push({
          perfilId: profile.id,
          regiaoId: region.id,
          semana,
          preco: price,
          moeda: 'BRL',
          unidadePreco: 'cabeca',
          natureza: 'demonstrativa',
          conjuntoId: manifesto.conjuntoId,
          condicoesComerciaisId: 'avista-sem-frete-sem-tributos',
        });
      }
    }
  }
  return result;
}
