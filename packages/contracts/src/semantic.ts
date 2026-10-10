import { canonicalJson } from './canonical.js';
import { perfis as catalogoPerfis, regioes as catalogoRegioes } from './catalog.js';
import { validators } from './validation.js';
import type { Historico, Janela, ReferenciaSemanal, Resumo } from './types.js';

function ensure(condition: unknown): asserts condition {
  if (!condition) throw new TypeError('Contrato de mercado inválido');
}
const dayMs = 86400000;
function civil(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
function dateString(value: Date): string {
  ensure(value.getUTCFullYear() >= 1 && value.getUTCFullYear() <= 9999);
  return value.toISOString().slice(0, 10);
}
function addDays(value: string, days: number): string {
  return dateString(new Date(civil(value).getTime() + days * dayMs));
}
function calendar(janela: Janela): string[] {
  const start = civil(janela.inicio);
  ensure(start.getUTCDate() === 1);
  const after = new Date(start.getTime());
  after.setUTCFullYear(start.getUTCFullYear() + 1);
  ensure(janela.fim === dateString(new Date(after.getTime() - dayMs)));
  const first = new Date(start.getTime() + ((8 - start.getUTCDay()) % 7) * dayMs);
  const weeks: string[] = [];
  for (let ms = first.getTime(); ms <= civil(janela.fim).getTime(); ms += 7 * dayMs)
    weeks.push(dateString(new Date(ms)));
  ensure(janela.primeiraSemana === weeks[0]);
  ensure(janela.ultimaSemana === weeks.at(-1));
  ensure(janela.semanaAnterior === addDays(janela.primeiraSemana, -7));
  ensure(janela.quantidadeSemanasNaJanela === weeks.length);
  return [janela.semanaAnterior, ...weeks];
}

function validateRecords(
  value: Resumo | Historico,
  resumo: Resumo,
  weeks: string[],
  profiles: string[],
): void {
  const regions = resumo.regioes.map((r) => r.id);
  const weekOrder = new Map(weeks.map((week, index) => [week, index]));
  const profileOrder = new Map(profiles.map((id, index) => [id, index]));
  const regionOrder = new Map(regions.map((id, index) => [id, index]));
  const conditions = new Set(resumo.condicoesComerciais.map((c) => c.id));
  const prices = new Map<string, Set<string>>();
  let lastPrice = -1;
  for (const price of value.precos) {
    const w = weekOrder.get(price.semana);
    const p = profileOrder.get(price.perfilId);
    const r = regionOrder.get(price.regiaoId);
    ensure(w !== undefined && p !== undefined && r !== undefined);
    const order = (w * profiles.length + p) * regions.length + r;
    ensure(order > lastPrice);
    lastPrice = order;
    ensure(price.natureza === value.natureza && price.conjuntoId === value.conjuntoId);
    ensure(conditions.has(price.condicoesComerciaisId));
    const key = `${price.semana}|${price.perfilId}`;
    const present = prices.get(key) ?? new Set<string>();
    ensure(!present.has(price.regiaoId));
    present.add(price.regiaoId);
    prices.set(key, present);
  }
  ensure(value.referenciasSemanais.length === weeks.length * profiles.length);
  let index = 0;
  for (const week of weeks) {
    for (const profile of profiles) {
      const reference = value.referenciasSemanais[index++];
      ensure(reference && reference.semana === week && reference.perfilId === profile);
      const present = prices.get(`${week}|${profile}`) ?? new Set<string>();
      let lastRegion = -1;
      for (const absent of reference.regioesAusentes) {
        const order = regionOrder.get(absent);
        ensure(order !== undefined && order > lastRegion && !present.has(absent));
        lastRegion = order;
      }
      ensure(present.size + reference.regioesAusentes.length === regions.length);
    }
  }
}

export function assertResumo(value: unknown): asserts value is Resumo {
  ensure(validators.Resumo(value));
  const resumo = value as Resumo;
  calendar(resumo.janela);
  ensure(canonicalJson(resumo.perfis) === canonicalJson(catalogoPerfis));
  ensure(canonicalJson(resumo.regioes) === canonicalJson(catalogoRegioes));
  ensure(resumo.regioes.every((r) => r.versaoTerritorial === resumo.versaoTerritorial));
  const fontes = new Set(resumo.referenciasFontes.map((f) => f.id));
  ensure(fontes.size === resumo.referenciasFontes.length);
  ensure(resumo.perfis.every((p) => fontes.has(p.referenciaParametrosId)));
  ensure(fontes.has(resumo.versaoTerritorial));
  validateRecords(
    resumo,
    resumo,
    [addDays(resumo.janela.ultimaSemana, -7), resumo.janela.ultimaSemana],
    resumo.perfis.map((p) => p.id),
  );
}

export function assertHistorico(
  value: unknown,
  resumo: Resumo,
  perfilId: string,
): asserts value is Historico {
  assertResumo(resumo);
  ensure(validators.Historico(value));
  const historico = value as Historico;
  ensure(historico.perfilId === perfilId && resumo.perfis.some((p) => p.id === perfilId));
  const fields = [
    'schemaVersion',
    'versaoDados',
    'publicadoEm',
    'natureza',
    'conjuntoId',
    'aviso',
    'versaoTerritorial',
    'janela',
    'condicoesComerciais',
    'referenciasFontes',
  ] as const;
  ensure(fields.every((field) => canonicalJson(historico[field]) === canonicalJson(resumo[field])));
  validateRecords(historico, resumo, calendar(historico.janela), [perfilId]);
  const common = new Set([addDays(resumo.janela.ultimaSemana, -7), resumo.janela.ultimaSemana]);
  ensure(
    canonicalJson(historico.precos.filter((p) => common.has(p.semana))) ===
      canonicalJson(resumo.precos.filter((p) => p.perfilId === perfilId)),
  );
  const references = (rows: ReferenciaSemanal[]) =>
    rows.filter((r) => r.perfilId === perfilId && common.has(r.semana));
  ensure(
    canonicalJson(references(historico.referenciasSemanais)) ===
      canonicalJson(references(resumo.referenciasSemanais)),
  );
}
