import { readFileSync } from 'node:fs';
import type { Historico, Perfil, PrecoRegional, Resumo } from '@pecuaria/contracts/types';
import { assertHistorico, assertResumo } from '@pecuaria/contracts/server';

const base = new URL('../../../data/demonstrativa/v0.1/', import.meta.url);
const ler = (arquivo: string): string => readFileSync(new URL(arquivo, base), 'utf8');
interface Manifesto {
  conjuntoId: string;
  versaoDados: string;
  natureza: 'demonstrativa';
  aviso: string;
  versaoTerritorial: string;
  condicoesComerciais: Resumo['condicoesComerciais'];
  janela: Resumo['janela'];
  referencias: (Resumo['referenciasFontes'][number] & Record<string, unknown>)[];
}
interface RegiaoArquivo {
  id: Resumo['regioes'][number]['id'];
  ordem: number;
  codigoImb: Resumo['regioes'][number]['codigoImb'];
  nome: string;
  versaoTerritorial: string;
  municipios: { codigoIbge: string; nome: string }[];
}
const manifesto = JSON.parse(ler('manifesto.json')) as Manifesto;
const perfis = JSON.parse(ler('perfis.json')) as Perfil[];
const regioes = (JSON.parse(ler('regioes.json')) as RegiaoArquivo[]).map((r) => ({
  id: r.id,
  ordem: r.ordem,
  codigoImb: r.codigoImb,
  nome: r.nome,
  versaoTerritorial: r.versaoTerritorial,
  quantidadeMunicipios: r.municipios.length,
}));
const [cabecalho, ...linhas] = ler('precos.csv').trimEnd().split('\n');
if (!cabecalho) throw new Error('CSV sem cabeçalho');
const campos = cabecalho.split(',');
const precos = linhas.map((linha) =>
  Object.fromEntries(campos.map((campo, i) => [campo, linha.split(',')[i]])),
) as PrecoRegional[];
const { inicio, fim, primeiraSemana, ultimaSemana, semanaAnterior, quantidadeSemanasNaJanela } =
  manifesto.janela;
const comum = {
  schemaVersion: '1.0.0' as const,
  versaoDados: manifesto.versaoDados,
  natureza: manifesto.natureza,
  conjuntoId: manifesto.conjuntoId,
  aviso: manifesto.aviso,
  versaoTerritorial: manifesto.versaoTerritorial,
  condicoesComerciais: manifesto.condicoesComerciais,
  publicadoEm: '2026-10-07T12:00:00.000Z',
  janela: { inicio, fim, primeiraSemana, ultimaSemana, semanaAnterior, quantidadeSemanasNaJanela },
  referenciasFontes: manifesto.referencias
    .filter((r) => ['scot-reposicao', 'imb-regplan-2018'].includes(r.id))
    .map(({ id, instituicao, url, consultadaEm, uso }) => ({
      id,
      instituicao,
      url,
      consultadaEm,
      uso,
    })),
};
const semanas = (JSON.parse(ler('receita.json')) as { semanas: string[] }).semanas;
const referencias = (perfilIds: Perfil['id'][], datas: string[]) =>
  datas.flatMap((semana) =>
    perfilIds.map((perfilId) => ({
      perfilId,
      semana,
      regioesAusentes: regioes
        .filter(
          (r) =>
            !precos.some(
              (p) => p.perfilId === perfilId && p.semana === semana && p.regiaoId === r.id,
            ),
        )
        .map((r) => r.id),
    })),
  );
const resumo: Resumo = {
  ...comum,
  perfis,
  regioes,
  referenciasSemanais: referencias(
    perfis.map((p) => p.id),
    semanas.slice(-2),
  ),
  precos: precos.filter((p) => semanas.slice(-2).includes(p.semana)),
};
const historicos: Historico[] = perfis.map((p) => ({
  ...comum,
  perfilId: p.id,
  referenciasSemanais: referencias([p.id], semanas),
  precos: precos.filter((preco) => preco.perfilId === p.id),
}));
assertResumo(resumo);
for (const historico of historicos) assertHistorico(historico, resumo, historico.perfilId);
export const baseFixa = { resumo, historicos };
