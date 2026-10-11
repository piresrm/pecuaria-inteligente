import type { Janela, Perfil, PrecoRegional, Regiao, Resumo } from '@pecuaria/contracts/types';
import { canonicalJson, validators } from '@pecuaria/contracts/server';
import { lerArquivos, lerPrecos, type ArquivosLidos } from './read.js';
import { gerarPrecos, validarReceita, type Receita } from './recipe.js';

export interface MunicipioArquivo {
  codigoIbge: string;
  nome: string;
  nomeFonte: string;
  linhaFonte: number;
}
export interface RegiaoArquivo extends Omit<Regiao, 'quantidadeMunicipios'> {
  referenciaTerritorialId: string;
  nomeFonteImb: string;
  folhaFonteImb: string;
  municipios: MunicipioArquivo[];
}
export interface Manifesto extends Record<string, unknown> {
  versaoFormatoArquivos: '1';
  versaoDados: string;
  conjuntoId: string;
  natureza: 'demonstrativa';
  preparadoEm: string;
  aviso: string;
  versaoTerritorial: string;
  janela: Janela & { quantidadeSemanasComAnterior: number; diaReferencia: 'segunda-feira' };
  contagens: {
    perfis: number;
    regioes: number;
    municipios: number;
    precos: number;
    precosNaJanela: number;
    precosSemanaAnterior: number;
    combinacoesPossiveis: number;
    lacunas: number;
  };
  condicoesComerciais: Resumo['condicoesComerciais'];
  referencias: (Resumo['referenciasFontes'][number] & Record<string, unknown>)[];
}
export interface BaseValidada extends ArquivosLidos {
  manifesto: Manifesto;
  perfis: Perfil[];
  regioes: RegiaoArquivo[];
  precos: PrecoRegional[];
  receita: Receita;
}
function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function object(value: unknown, message: string): asserts value is Record<string, unknown> {
  ensure(value !== null && typeof value === 'object' && !Array.isArray(value), message);
}
const day = 86400000;
function weeksFor(window: Janela): string[] {
  const start = new Date(`${window.inicio}T00:00:00.000Z`);
  const after = new Date(start);
  after.setUTCFullYear(after.getUTCFullYear() + 1);
  ensure(
    start.getUTCDate() === 1 &&
      new Date(after.getTime() - day).toISOString().slice(0, 10) === window.fim,
    'Janela civil inválida',
  );
  const first = start.getTime() + ((8 - start.getUTCDay()) % 7) * day;
  const weeks: string[] = [];
  for (let ms = first; ms <= Date.parse(`${window.fim}T00:00:00.000Z`); ms += 7 * day)
    weeks.push(new Date(ms).toISOString().slice(0, 10));
  const previous = new Date(first - 7 * day).toISOString().slice(0, 10);
  ensure(
    window.primeiraSemana === weeks[0] &&
      window.ultimaSemana === weeks.at(-1) &&
      window.semanaAnterior === previous &&
      window.quantidadeSemanasNaJanela === weeks.length,
    'Calendário semanal inválido',
  );
  return [previous, ...weeks];
}
function validateManifest(value: unknown): asserts value is Manifesto {
  object(value, 'Manifesto inválido');
  ensure(
    value.versaoFormatoArquivos === '1' && value.natureza === 'demonstrativa',
    'Formato ou natureza inválidos',
  );
  ensure(
    validators.Identificador(value.versaoDados) && value.conjuntoId === value.versaoDados,
    'Identidade do conjunto inválida',
  );
  ensure(
    value.versaoTerritorial === 'imb-regplan-2018' && validators.DataCivil(value.preparadoEm),
    'Território ou data inválidos',
  );
  ensure(
    typeof value.aviso === 'string' && value.aviso.trim().length > 0 && value.aviso.length <= 512,
    'Aviso inválido',
  );
  object(value.janela, 'Janela inválida');
  const { inicio, fim, primeiraSemana, ultimaSemana, semanaAnterior, quantidadeSemanasNaJanela } =
    value.janela;
  ensure(
    validators.Janela({
      inicio,
      fim,
      primeiraSemana,
      ultimaSemana,
      semanaAnterior,
      quantidadeSemanasNaJanela,
    }),
    'Janela inválida',
  );
  ensure(
    value.janela.diaReferencia === 'segunda-feira' &&
      value.janela.quantidadeSemanasComAnterior === (quantidadeSemanasNaJanela as number) + 1,
    'Calendário inválido',
  );
  ensure(
    Array.isArray(value.condicoesComerciais) &&
      value.condicoesComerciais.length === 1 &&
      value.condicoesComerciais.every((c) => validators.Condicoes(c)),
    'Condições inválidas',
  );
  ensure(
    Array.isArray(value.referencias) && value.referencias.length >= 2,
    'Referências inválidas',
  );
  const ids = new Set<string>();
  for (const item of value.referencias) {
    object(item, 'Referência inválida');
    const { id, instituicao, url, consultadaEm, uso } = item;
    ensure(validators.Fonte({ id, instituicao, url, consultadaEm, uso }), 'Referência inválida');
    ensure(typeof id === 'string' && !ids.has(id), 'Referência duplicada');
    ids.add(id);
  }
  ensure(ids.has('scot-reposicao') && ids.has(value.versaoTerritorial), 'Referência ausente');
  object(value.contagens, 'Contagens inválidas');
  for (const name of [
    'perfis',
    'regioes',
    'municipios',
    'precos',
    'precosNaJanela',
    'precosSemanaAnterior',
    'combinacoesPossiveis',
    'lacunas',
  ]) {
    const count = value.contagens[name];
    ensure(
      typeof count === 'number' && Number.isSafeInteger(count) && count >= 0,
      'Contagens inválidas',
    );
  }
  object(value.serializacao, 'Serialização inválida');
  ensure(
    value.serializacao.codificacao === 'UTF-8' &&
      value.serializacao.fimLinha === 'LF' &&
      value.serializacao.csvSeparador === ',' &&
      value.serializacao.csvCabecalho === true,
    'Serialização inválida',
  );
}
interface Fields {
  [name: string]: string | Fields;
}
const scenarioSchemas: Record<string, Fields> = {
  CA03: {
    entrada: {
      preco: 'Preco',
      moeda: 'BRL',
      unidadePreco: 'cabeca',
      pesoReferencia: 'Peso',
      unidadePeso: 'kg',
    },
    esperado: { precoPorKgPesoVivo: 'Preco' },
  },
  CA04: {
    perfilId: 'PerfilId',
    semana: 'week',
    esperado: {
      cobertura: 'coverage',
      totalRegioes: 'coverage',
      somaPrecos: 'Preco',
      mediaEstadual: 'Preco',
    },
  },
  CA05: { semana: 'week', esperado: { registros: 'count', mediaEstadual: 'null' } },
  CA06: {
    perfilId: 'PerfilId',
    regiaoId: 'RegiaoId',
    anterior: 'week',
    atual: 'week',
    esperado: {
      precoAnterior: 'Preco',
      precoAtual: 'Preco',
      variacaoAbsoluta: 'moneyDifference',
      variacaoPercentual: 'percentage',
    },
  },
  'CA07-semana-ausente': {
    perfilId: 'PerfilId',
    regiaoId: 'RegiaoId',
    anterior: 'week',
    atual: 'week',
    esperado: { variacaoSemanal: 'null', motivo: 'text' },
  },
  'CA07-periodo-unico': {
    perfilId: 'PerfilId',
    regiaoId: 'RegiaoId',
    inicio: 'week',
    fim: 'week',
    esperado: { variacaoPeriodo: 'null', motivo: 'text' },
  },
  CA08: {
    perfilId: 'PerfilId',
    anterior: 'week',
    atual: 'week',
    esperado: {
      coberturaAnterior: 'coverage',
      coberturaAtual: 'coverage',
      mediaAnterior: 'Preco',
      mediaAtual: 'Preco',
      variacaoAbsoluta: 'moneyDifference',
      variacaoPercentual: 'percentage',
      regioesAnteriores: 'regions',
      regioesAtuais: 'regions',
      composicaoAlterada: 'boolean',
    },
  },
  'RN07-limite-inferior': {
    perfilId: 'PerfilId',
    regiaoId: 'RegiaoId',
    anterior: 'week',
    atual: 'week',
    esperado: { ambasReferenciasPresentes: 'boolean' },
  },
  'lacuna-consecutiva': {
    perfilId: 'PerfilId',
    regiaoId: 'RegiaoId',
    semanas: 'weeks',
    esperado: { registros: 'count' },
  },
};
function validateScenarioFields(value: unknown, fields: Fields, weeks: string[]): void {
  object(value, 'Cenário: objeto inválido');
  for (const [name, type] of Object.entries(fields)) {
    const item = value[name];
    if (typeof type !== 'string') {
      validateScenarioFields(item, type, weeks);
      continue;
    }
    let valid: boolean;
    switch (type) {
      case 'count':
      case 'coverage':
        valid =
          typeof item === 'number' &&
          Number.isInteger(item) &&
          item >= 0 &&
          item <= (type === 'coverage' ? 10 : 80);
        break;
      case 'week':
        valid = typeof item === 'string' && weeks.includes(item);
        break;
      case 'weeks':
        valid =
          Array.isArray(item) &&
          item.length > 0 &&
          item.every((v) => typeof v === 'string' && weeks.includes(v)) &&
          new Set(item).size === item.length;
        break;
      case 'regions':
        valid =
          Array.isArray(item) &&
          item.length <= 10 &&
          item.every((v) => validators.RegiaoId(v)) &&
          new Set(item).size === item.length;
        break;
      case 'null':
        valid = item === null;
        break;
      case 'boolean':
        valid = typeof item === 'boolean';
        break;
      case 'text':
        valid = typeof item === 'string' && item.trim().length > 0;
        break;
      case 'moneyDifference':
        valid = typeof item === 'string' && /^-?(?:0|[1-9][0-9]{0,9})\.[0-9]{2}$/.test(item);
        break;
      case 'percentage':
        valid = typeof item === 'string' && /^-?(?:0|[1-9][0-9]*)\.[0-9]$/.test(item);
        break;
      case 'Preco':
        valid = validators.Preco(item);
        break;
      case 'Peso':
        valid = validators.Peso(item);
        break;
      case 'PerfilId':
        valid = validators.PerfilId(item);
        break;
      case 'RegiaoId':
        valid = validators.RegiaoId(item);
        break;
      default:
        valid = item === type;
    }
    ensure(valid, `Cenário: campo inválido ${name}`);
  }
}
function validateScenarios(value: unknown, manifest: Manifesto, weeks: string[]): void {
  object(value, 'Cenários inválidos');
  ensure(
    value.versaoCenarios === '1' &&
      value.conjuntoId === manifest.conjuntoId &&
      Array.isArray(value.casos) &&
      value.casos.length === Object.keys(scenarioSchemas).length,
    'Cenários incompatíveis',
  );
  const ids = new Set<string>();
  for (const item of value.casos) {
    object(item, 'Cenário inválido');
    ensure(
      typeof item.id === 'string' && Object.hasOwn(scenarioSchemas, item.id) && !ids.has(item.id),
      'Cenário duplicado ou desconhecido',
    );
    ids.add(item.id);
    validateScenarioFields(item, scenarioSchemas[item.id]!, weeks);
  }
}
export async function validarBase(diretorio: string): Promise<BaseValidada> {
  const files = await lerArquivos(diretorio);
  const manifest: unknown = JSON.parse(files.arquivos['manifesto.json']);
  validateManifest(manifest);
  // These two frozen catalogs are the approved profiles and full IMB/IBGE composition.
  // Their hashes come from the published six-file SHA256SUMS, not a recipe oracle.
  ensure(
    files.hashes['perfis.json'] ===
      'df828317b7fa382b597dbeacaa7f306521e10b19cdcc1b7077bf861d3efb2fb1',
    'Cadastro de perfis divergente',
  );
  ensure(
    files.hashes['regioes.json'] ===
      'c38525fef59d3fc24e54b9297f184968b2dc9dc62187a776da6f5cae84561aa4',
    'Cadastro territorial divergente',
  );
  const perfis = JSON.parse(files.arquivos['perfis.json']) as Perfil[];
  const regioes = JSON.parse(files.arquivos['regioes.json']) as RegiaoArquivo[];
  ensure(
    perfis.every((p) => validators.Perfil(p)),
    'Perfil inválido',
  );
  const weeks = weeksFor(manifest.janela);
  const recipe: unknown = JSON.parse(files.arquivos['receita.json']);
  validarReceita(recipe, weeks, perfis, regioes);
  const parsed = lerPrecos(files.arquivos['precos.csv']);
  const keys = new Set<string>();
  for (const price of parsed) {
    ensure(validators.PrecoRegional(price), 'Preço decimal ou contrato inválido');
    const key = canonicalJson([price.perfilId, price.regiaoId, price.semana]);
    ensure(!keys.has(key), 'Preço duplicado');
    keys.add(key);
  }
  const precos = parsed as PrecoRegional[];
  ensure(
    canonicalJson(precos) === canonicalJson(gerarPrecos(manifest, perfis, regioes, recipe)),
    'Preços ou lacunas divergem da receita',
  );
  const expected = {
    perfis: perfis.length,
    regioes: regioes.length,
    municipios: regioes.reduce((n, r) => n + r.municipios.length, 0),
    precos: precos.length,
    precosNaJanela: precos.filter((p) => p.semana !== manifest.janela.semanaAnterior).length,
    precosSemanaAnterior: precos.filter((p) => p.semana === manifest.janela.semanaAnterior).length,
    combinacoesPossiveis: weeks.length * perfis.length * regioes.length,
    lacunas: weeks.length * perfis.length * regioes.length - precos.length,
  };
  ensure(canonicalJson(manifest.contagens) === canonicalJson(expected), 'Contagens divergentes');
  const scenarios: unknown = JSON.parse(files.arquivos['cenarios.json']);
  validateScenarios(scenarios, manifest, weeks);
  return { ...files, manifesto: manifest, perfis, regioes, precos, receita: recipe };
}
