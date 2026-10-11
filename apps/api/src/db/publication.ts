import { eq } from 'drizzle-orm';
import type { BaseValidada } from '../demo/validate.js';
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

export interface Publicacao {
  versaoDados: string;
  publicadoEm: string;
  resultado: 'publicada' | 'existente' | 'preservada';
}
type Version = typeof versoesDados.$inferSelect;
function metadata(version: Version, resultado: Publicacao['resultado']): Publicacao {
  if (
    version.estado !== 'publicada' ||
    !version.publicadoEm ||
    !Number.isFinite(version.publicadoEm.getTime())
  )
    throw new Error('Publicação incompatível: versão não finalizada');
  return {
    versaoDados: version.versaoDados,
    publicadoEm: version.publicadoEm.toISOString(),
    resultado,
  };
}
function assertCompatible(version: Version): void {
  metadata(version, 'preservada');
  if (
    version.versaoFormatoArquivos !== '1' ||
    version.natureza !== 'demonstrativa' ||
    version.versaoTerritorial !== 'imb-regplan-2018'
  )
    throw new Error('Publicação atual incompatível com a preparação demonstrativa');
}
export async function publicarBase(
  db: DatabaseHandle,
  base: BaseValidada,
  modo: 'inicial' | 'explicito',
): Promise<Publicacao> {
  // All file IO, validation and recipe generation are completed by validarBase.
  // The same pointer lock serializes every publisher before any version is inspected.
  return db.db.transaction(
    async (tx) => {
      const [pointer] = await tx
        .select()
        .from(publicacaoAtual)
        .where(eq(publicacaoAtual.id, 1))
        .for('update');
      if (!pointer) throw new Error('Ponteiro de publicação indisponível');
      if (modo === 'inicial' && pointer.versaoDados !== null) {
        const [current] = await tx
          .select()
          .from(versoesDados)
          .where(eq(versoesDados.versaoDados, pointer.versaoDados));
        if (!current) throw new Error('Publicação atual incompatível');
        assertCompatible(current);
        const [candidate] = await tx
          .select()
          .from(versoesDados)
          .where(eq(versoesDados.versaoDados, base.manifesto.versaoDados));
        if (candidate && candidate.hashConjuntoSha256 !== base.hashConjuntoSha256)
          throw new Error('Conflito de identidade: versão existente com SHA-256 diferente');
        return metadata(current, 'preservada');
      }
      const m = base.manifesto;
      const [existing] = await tx
        .select()
        .from(versoesDados)
        .where(eq(versoesDados.versaoDados, m.versaoDados));
      if (existing) {
        if (existing.hashConjuntoSha256 !== base.hashConjuntoSha256)
          throw new Error('Conflito de identidade: versão existente com SHA-256 diferente');
        return metadata(existing, 'existente');
      }
      await tx.insert(versoesDados).values({
        versaoDados: m.versaoDados,
        conjuntoId: m.conjuntoId,
        versaoFormatoArquivos: m.versaoFormatoArquivos,
        natureza: m.natureza,
        versaoTerritorial: m.versaoTerritorial,
        preparadoEm: m.preparadoEm,
        janelaInicio: m.janela.inicio,
        janelaFim: m.janela.fim,
        primeiraSemana: m.janela.primeiraSemana,
        ultimaSemana: m.janela.ultimaSemana,
        semanaAnterior: m.janela.semanaAnterior,
        hashConjuntoSha256: base.hashConjuntoSha256,
        manifesto: m,
        estado: 'preparacao',
      });
      await tx.insert(perfis).values(
        base.perfis.map((p) => ({
          versaoDados: m.versaoDados,
          perfilId: p.id,
          ordem: p.ordem,
          categoria: p.categoria,
          sexo: p.sexo,
          grupoRacial: p.grupoRacial,
          idadeReferenciaMeses: p.idadeReferenciaMeses,
          pesoReferencia: p.pesoReferencia,
          unidadePeso: p.unidadePeso,
          referenciaParametrosId: p.referenciaParametrosId,
        })),
      );
      await tx.insert(regioes).values(
        base.regioes.map((r) => ({
          versaoDados: m.versaoDados,
          regiaoId: r.id,
          ordem: r.ordem,
          codigoImb: r.codigoImb,
          nome: r.nome,
          nomeFonteImb: r.nomeFonteImb,
          folhaFonteImb: r.folhaFonteImb,
        })),
      );
      await tx.insert(municipios).values(
        base.regioes.flatMap((r) =>
          r.municipios.map((c) => ({
            versaoDados: m.versaoDados,
            regiaoId: r.id,
            codigoIbge: c.codigoIbge,
            nome: c.nome,
            nomeFonteImb: c.nomeFonte,
            linhaFonteImb: c.linhaFonte,
          })),
        ),
      );
      await tx.insert(condicoesComerciais).values(
        m.condicoesComerciais.map((c) => ({
          versaoDados: m.versaoDados,
          condicoesId: c.id,
          pagamento: c.pagamento,
          frete: c.frete,
          tributos: c.tributos,
          descricao: c.descricao,
        })),
      );
      // Bounded batches also fit future 53-week windows within PostgreSQL's parameter limit.
      for (let start = 0; start < base.precos.length; start += 400) {
        await tx.insert(precos).values(
          base.precos.slice(start, start + 400).map((p) => ({
            versaoDados: m.versaoDados,
            perfilId: p.perfilId,
            regiaoId: p.regiaoId,
            semana: p.semana,
            condicoesId: p.condicoesComerciaisId,
            preco: p.preco,
            moeda: p.moeda,
            unidadePreco: p.unidadePreco,
            natureza: p.natureza,
          })),
        );
      }
      // The trigger alone assigns clock_timestamp()::timestamptz(3).
      const [published] = await tx
        .update(versoesDados)
        .set({ estado: 'publicada' })
        .where(eq(versoesDados.versaoDados, m.versaoDados))
        .returning();
      if (!published) throw new Error('Finalização indisponível');
      await tx
        .update(publicacaoAtual)
        .set({ versaoDados: m.versaoDados })
        .where(eq(publicacaoAtual.id, 1));
      return metadata(published, 'publicada');
    },
    { isolationLevel: 'read committed' },
  );
}
