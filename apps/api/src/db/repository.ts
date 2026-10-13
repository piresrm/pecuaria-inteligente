import { and, asc, count, eq, gte, isNotNull, lte, or, sql } from 'drizzle-orm';
import type { Historico, ReferenciaSemanal, Resumo } from '@pecuaria/contracts/types';
import { assertHistorico, assertResumo } from '@pecuaria/contracts/server';
import type { DatabaseHandle } from './client.js';
import {
  condicoesComerciais,
  municipios,
  perfis,
  precos,
  publicacaoAtual,
  regioes,
  versoesDados,
} from './schema.js';
export interface MercadoRepository {
  lerVersaoAtual(): Promise<string | null>;
  lerResumo(versao: string): Promise<Resumo | null>;
  lerHistorico(versao: string, perfilId: string): Promise<Historico | null>;
}
export class DatabaseReadError extends Error {
  constructor(cause: unknown) {
    super('Leitura do banco indisponível', { cause });
  }
}
async function databaseRead<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new DatabaseReadError(error);
  }
}
const dayMs = 86400000;
function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + days * dayMs).toISOString().slice(0, 10);
}
function projectSources(value: unknown, territory: string): unknown {
  if (!Array.isArray(value)) throw new TypeError('Referências internas incompatíveis');
  return value
    .filter(
      (f: unknown) =>
        f !== null &&
        typeof f === 'object' &&
        'id' in f &&
        (f.id === 'scot-reposicao' || f.id === territory),
    )
    .map((f: unknown) => {
      if (f === null || typeof f !== 'object') throw new TypeError('Fonte incompatível');
      const row = f as Record<string, unknown>;
      return {
        id: row.id,
        instituicao: row.instituicao,
        url: row.url,
        consultadaEm: row.consultadaEm,
        uso: row.uso,
      };
    });
}
function references(
  resumo: Resumo,
  weeks: string[],
  profiles: Resumo['perfis'],
  prices: Resumo['precos'],
): ReferenciaSemanal[] {
  const present = new Map<string, Set<string>>();
  for (const price of prices) {
    const key = `${price.semana}/${price.perfilId}`;
    const regions = present.get(key) ?? new Set<string>();
    regions.add(price.regiaoId);
    present.set(key, regions);
  }
  return weeks.flatMap((semana) =>
    profiles.map((p) => ({
      perfilId: p.id,
      semana,
      regioesAusentes: resumo.regioes
        .filter((r) => !present.get(`${semana}/${p.id}`)?.has(r.id))
        .map((r) => r.id),
    })),
  );
}
export function createRepository(database: DatabaseHandle): MercadoRepository {
  async function snapshot(versao: string, requestedProfile?: string) {
    // READ COMMITTED is sufficient: all projections fix this version and published
    // rows are immutable/retained. No pointer is read again within a resource.
    const rows = await databaseRead(() =>
      database.db.transaction(
        async (tx) => {
          const [version] = await tx
            .select({
              versaoDados: versoesDados.versaoDados,
              conjuntoId: versoesDados.conjuntoId,
              versaoFormatoArquivos: versoesDados.versaoFormatoArquivos,
              publicadoEm: versoesDados.publicadoEm,
              natureza: versoesDados.natureza,
              versaoTerritorial: versoesDados.versaoTerritorial,
              inicio: versoesDados.janelaInicio,
              fim: versoesDados.janelaFim,
              primeiraSemana: versoesDados.primeiraSemana,
              ultimaSemana: versoesDados.ultimaSemana,
              semanaAnterior: versoesDados.semanaAnterior,
              aviso: sql<unknown>`${versoesDados.manifesto}->'aviso'`,
              fontes: sql<unknown>`${versoesDados.manifesto}->'referencias'`,
            })
            .from(versoesDados)
            .where(
              and(
                eq(versoesDados.versaoDados, versao),
                eq(versoesDados.estado, 'publicada'),
                isNotNull(versoesDados.publicadoEm),
              ),
            );
          if (!version) return null;
          const profiles = await tx
            .select({
              id: perfis.perfilId,
              ordem: perfis.ordem,
              categoria: perfis.categoria,
              sexo: perfis.sexo,
              grupoRacial: perfis.grupoRacial,
              idadeReferenciaMeses: perfis.idadeReferenciaMeses,
              pesoReferencia: perfis.pesoReferencia,
              unidadePeso: perfis.unidadePeso,
              referenciaParametrosId: perfis.referenciaParametrosId,
            })
            .from(perfis)
            .where(eq(perfis.versaoDados, versao))
            .orderBy(asc(perfis.ordem));
          const regions = await tx
            .select({
              id: regioes.regiaoId,
              ordem: regioes.ordem,
              codigoImb: regioes.codigoImb,
              nome: regioes.nome,
              versaoTerritorial: versoesDados.versaoTerritorial,
              quantidadeMunicipios: count(municipios.codigoIbge),
            })
            .from(regioes)
            .innerJoin(versoesDados, eq(versoesDados.versaoDados, regioes.versaoDados))
            .leftJoin(
              municipios,
              and(
                eq(municipios.versaoDados, regioes.versaoDados),
                eq(municipios.regiaoId, regioes.regiaoId),
              ),
            )
            .where(eq(regioes.versaoDados, versao))
            .groupBy(regioes.versaoDados, regioes.regiaoId, versoesDados.versaoTerritorial)
            .orderBy(asc(regioes.ordem));
          const conditions = await tx
            .select({
              id: condicoesComerciais.condicoesId,
              pagamento: condicoesComerciais.pagamento,
              frete: condicoesComerciais.frete,
              tributos: condicoesComerciais.tributos,
              descricao: condicoesComerciais.descricao,
            })
            .from(condicoesComerciais)
            .where(eq(condicoesComerciais.versaoDados, versao))
            .orderBy(asc(condicoesComerciais.condicoesId));
          const prices = await tx
            .select({
              perfilId: precos.perfilId,
              regiaoId: precos.regiaoId,
              semana: precos.semana,
              preco: precos.preco,
              moeda: precos.moeda,
              unidadePreco: precos.unidadePreco,
              natureza: precos.natureza,
              conjuntoId: versoesDados.conjuntoId,
              condicoesComerciaisId: precos.condicoesId,
            })
            .from(precos)
            .innerJoin(
              perfis,
              and(eq(perfis.versaoDados, precos.versaoDados), eq(perfis.perfilId, precos.perfilId)),
            )
            .innerJoin(
              regioes,
              and(
                eq(regioes.versaoDados, precos.versaoDados),
                eq(regioes.regiaoId, precos.regiaoId),
              ),
            )
            .innerJoin(versoesDados, eq(versoesDados.versaoDados, precos.versaoDados))
            .where(
              and(
                eq(precos.versaoDados, versao),
                gte(
                  precos.semana,
                  requestedProfile ? version.semanaAnterior : addDays(version.ultimaSemana, -7),
                ),
                lte(precos.semana, version.ultimaSemana),
                requestedProfile
                  ? or(
                      eq(precos.perfilId, requestedProfile),
                      gte(precos.semana, addDays(version.ultimaSemana, -7)),
                    )
                  : undefined,
              ),
            )
            .orderBy(asc(precos.semana), asc(perfis.ordem), asc(regioes.ordem));
          return { version, profiles, regions, conditions, prices };
        },
        { isolationLevel: 'read committed', accessMode: 'read only' },
      ),
    );
    if (!rows) return null;
    const { version, profiles, regions, conditions, prices } = rows;
    if (version.versaoFormatoArquivos !== '1' || !version.publicadoEm)
      throw new TypeError('Formato interno incompatível');
    const recent = [addDays(version.ultimaSemana, -7), version.ultimaSemana];
    const common = {
      schemaVersion: '1.0.0',
      versaoDados: version.versaoDados,
      publicadoEm: version.publicadoEm.toISOString(),
      natureza: version.natureza,
      conjuntoId: version.conjuntoId,
      aviso: version.aviso,
      versaoTerritorial: version.versaoTerritorial,
      janela: {
        inicio: version.inicio,
        fim: version.fim,
        primeiraSemana: version.primeiraSemana,
        ultimaSemana: version.ultimaSemana,
        semanaAnterior: version.semanaAnterior,
        quantidadeSemanasNaJanela:
          (Date.parse(version.ultimaSemana) - Date.parse(version.primeiraSemana)) / (7 * dayMs) + 1,
      },
      condicoesComerciais: conditions,
      referenciasFontes: projectSources(version.fontes, version.versaoTerritorial),
    };
    // This temporary shape is not trusted until the full structural and semantic
    // validator below. Text/numeric columns never become JS monetary numbers.
    const resumo = {
      ...common,
      perfis: profiles,
      regioes: regions,
      referenciasSemanais: [],
      precos: prices.filter((p) => recent.includes(p.semana)),
    } as unknown as Resumo;
    resumo.referenciasSemanais = references(resumo, recent, resumo.perfis, resumo.precos);
    assertResumo(resumo);
    if (!requestedProfile) return { resumo, historico: null };
    const perfil = resumo.perfis.find((p) => p.id === requestedProfile);
    if (!perfil) return { resumo, historico: null };
    const weeks: string[] = [];
    for (let week = version.semanaAnterior; week <= version.ultimaSemana; week = addDays(week, 7))
      weeks.push(week);
    const historyPrices = prices.filter((p) => p.perfilId === requestedProfile) as Resumo['precos'];
    const historico: unknown = {
      ...common,
      perfilId: requestedProfile,
      referenciasSemanais: references(resumo, weeks, [perfil], historyPrices),
      precos: historyPrices,
    };
    assertHistorico(historico, resumo, requestedProfile);
    return { resumo, historico };
  }
  return {
    async lerVersaoAtual() {
      const rows = await databaseRead(() =>
        database.db
          .select({ versaoDados: versoesDados.versaoDados })
          .from(publicacaoAtual)
          .innerJoin(versoesDados, eq(versoesDados.versaoDados, publicacaoAtual.versaoDados))
          .where(
            and(
              eq(publicacaoAtual.id, 1),
              eq(versoesDados.estado, 'publicada'),
              isNotNull(versoesDados.publicadoEm),
            ),
          ),
      );
      return rows[0]?.versaoDados ?? null;
    },
    async lerResumo(versao) {
      return (await snapshot(versao))?.resumo ?? null;
    },
    async lerHistorico(versao, perfilId) {
      return (await snapshot(versao, perfilId))?.historico ?? null;
    },
  };
}
