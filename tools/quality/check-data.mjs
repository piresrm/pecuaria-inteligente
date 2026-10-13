import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raizBase = fileURLToPath(new URL('../../data/demonstrativa/v0.1/', import.meta.url));
const arquivos = [
  'manifesto.json',
  'perfis.json',
  'regioes.json',
  'precos.csv',
  'receita.json',
  'cenarios.json',
];
const cabecalho =
  'perfilId,regiaoId,semana,preco,moeda,unidadePreco,natureza,conjuntoId,condicoesComerciaisId';
const decimal = /^(?:0|[1-9]\d*)\.\d{2}$/;
const centavos = (preco) => {
  assert(decimal.test(preco), 'Decimal inválido');
  const valor = BigInt(preco.replace('.', ''));
  assert(valor > 0n, 'Preço/peso não positivo');
  return valor;
};
const racional = (n, d = 1n) => ({ n, d });
// Aritmética racional independente de big.js para conferir resultados da base.
function apresentar({ n, d }, casas) {
  const sinal = n < 0n ? '-' : '';
  const magnitude = n < 0n ? -n : n;
  const escala = 10n ** BigInt(casas);
  const quociente = (magnitude * escala) / d;
  const arredondado = quociente + (2n * ((magnitude * escala) % d) >= d ? 1n : 0n);
  return `${arredondado === 0n ? '' : sinal}${arredondado / escala}.${String(arredondado % escala).padStart(casas, '0')}`;
}
function calendario(inicio, fim) {
  const data = new Date(`${inicio}T00:00:00.000Z`);
  assert(
    Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === inicio,
    'Calendário inválido',
  );
  const limite = new Date(`${fim}T00:00:00.000Z`);
  assert(
    Number.isFinite(limite.getTime()) &&
      limite.toISOString().slice(0, 10) === fim &&
      data <= limite,
    'Calendário inválido',
  );
  const semanas = [];
  while (data <= limite) {
    if (data.getUTCDay() === 1) semanas.push(data.toISOString().slice(0, 10));
    data.setUTCDate(data.getUTCDate() + 1);
  }
  return semanas;
}
export function verificarBase(diretorio = raizBase) {
  const ler = (arquivo) => readFileSync(resolve(diretorio, arquivo), 'utf8');
  const somas = ler('SHA256SUMS').trimEnd().split('\n');
  assert.equal(somas.length, arquivos.length, 'SHA-256 incompletos');
  const nomes = new Set();
  for (const linha of somas) {
    const match = /^([a-f0-9]{64}) {2}([a-zA-Z0-9.]+)$/.exec(linha);
    assert(match && arquivos.includes(match[2]) && !nomes.has(match[2]), 'SHA-256 inválido');
    nomes.add(match[2]);
    assert.equal(
      createHash('sha256').update(ler(match[2])).digest('hex'),
      match[1],
      `SHA-256 divergente: ${match[2]}`,
    );
  }
  const json = (arquivo) => JSON.parse(ler(arquivo));
  const manifesto = json('manifesto.json');
  const perfis = json('perfis.json');
  const regioes = json('regioes.json');
  const receita = json('receita.json');
  const cenarios = json('cenarios.json');
  assert.equal(manifesto.versaoFormatoArquivos, '1');
  assert.equal(manifesto.conjuntoId, cenarios.conjuntoId);
  assert.equal(manifesto.versaoDados, manifesto.conjuntoId);
  assert.equal(manifesto.natureza, 'demonstrativa');
  assert.equal(perfis.length, manifesto.contagens.perfis);
  assert.equal(regioes.length, manifesto.contagens.regioes);
  assert.equal(perfis.length, 8);
  assert.equal(regioes.length, 10);
  assert.equal(new Set(perfis.map((p) => p.id)).size, 8, 'Perfis duplicados');
  assert.equal(new Set(regioes.map((r) => r.id)).size, 10, 'Regiões duplicadas');
  perfis.forEach((p, i) => {
    assert.equal(p.ordem, i + 1);
    centavos(p.pesoReferencia);
    assert.equal(p.unidadePeso, 'kg');
  });
  regioes.forEach((r, i) => {
    assert.equal(r.ordem, i + 1);
    assert.equal(r.versaoTerritorial, manifesto.versaoTerritorial);
  });
  const municipios = regioes.flatMap((r) => r.municipios);
  assert(
    municipios.every(
      (m) => /^52\d{5}$/.test(m.codigoIbge) && typeof m.nome === 'string' && m.nome.length > 0,
    ),
    'Municípios inválidos',
  );
  assert.equal(
    new Set(municipios.map((m) => m.codigoIbge)).size,
    246,
    'Municípios repetidos ou incompletos',
  );
  assert.equal(municipios.length, manifesto.contagens.municipios, 'Municípios divergentes');
  const { janela } = manifesto;
  const semanas = calendario(janela.inicio, janela.fim);
  const primeiro = new Date(`${semanas[0]}T00:00:00.000Z`);
  primeiro.setUTCDate(primeiro.getUTCDate() - 7);
  const anterior = primeiro.toISOString().slice(0, 10);
  assert.equal(janela.primeiraSemana, semanas[0], 'Calendário primeira semana');
  assert.equal(janela.ultimaSemana, semanas.at(-1), 'Calendário última semana');
  assert.equal(janela.semanaAnterior, anterior, 'Calendário auxiliar');
  assert.equal(janela.quantidadeSemanasNaJanela, semanas.length);
  assert.equal(janela.quantidadeSemanasComAnterior, semanas.length + 1);
  const fimCivil = new Date(`${janela.inicio}T00:00:00.000Z`);
  assert.equal(fimCivil.getUTCDate(), 1, 'Janela deve iniciar mês civil');
  fimCivil.setUTCFullYear(fimCivil.getUTCFullYear() + 1);
  fimCivil.setUTCDate(fimCivil.getUTCDate() - 1);
  assert.equal(fimCivil.toISOString().slice(0, 10), janela.fim, 'Janela de doze meses civis');
  assert.deepEqual(receita.semanas, [anterior, ...semanas], 'Receita: calendário');
  assert.equal(receita.versaoReceita, '1');
  assert.equal(receita.indiceInicial, 0);
  for (const [campo, tamanho] of [
    ['basesCentavos', 8],
    ['incrementosSemanaisCentavos', 8],
    ['deslocamentosRegionaisCentavos', 10],
    ['cicloCentavos', 12],
  ]) {
    assert.equal(receita[campo].length, tamanho, 'Receita: dimensão');
    assert(receita[campo].every(Number.isSafeInteger), 'Receita: parâmetros inteiros');
  }
  assert(Number.isSafeInteger(receita.semente), 'Receita: semente inteira');
  const geradas = [];
  let lacunas = 0;
  receita.semanas.forEach((semana, s) =>
    perfis.forEach((perfil, p) =>
      regioes.forEach((regiao, r) => {
        const ruido = ((receita.semente + 31 * p + 17 * r + 13 * s + 7 * s * s) % 1501) - 750;
        const valor =
          receita.basesCentavos[p] +
          receita.incrementosSemanaisCentavos[p] * s +
          receita.deslocamentosRegionaisCentavos[r] +
          receita.cicloCentavos[Math.floor(s / 4) % 12] +
          ruido;
        const substituicao = receita.substituicoes.find(
          (v) => v.semana === semana && v.perfilId === perfil.id && v.regiaoId === regiao.id,
        );
        const preco =
          substituicao?.preco ??
          `${Math.floor(valor / 100)}.${String(valor % 100).padStart(2, '0')}`;
        if (
          receita.lacunas.some(
            (l) =>
              l.semana === semana &&
              (l.perfilId === '*' || l.perfilId === perfil.id) &&
              (l.regiaoId === '*' || l.regiaoId === regiao.id),
          )
        ) {
          lacunas++;
          return;
        }
        centavos(preco);
        geradas.push(
          [
            perfil.id,
            regiao.id,
            semana,
            preco,
            'BRL',
            'cabeca',
            'demonstrativa',
            manifesto.conjuntoId,
            manifesto.condicoesComerciais[0].id,
          ].join(','),
        );
      }),
    ),
  );
  assert.equal(
    ler('precos.csv'),
    `${cabecalho}\n${geradas.join('\n')}\n`,
    'Receita: reprodução integral divergente',
  );
  const precos = geradas.map((linha) =>
    Object.fromEntries(cabecalho.split(',').map((campo, i) => [campo, linha.split(',')[i]])),
  );
  assert.equal(
    new Set(precos.map((p) => `${p.perfilId}|${p.regiaoId}|${p.semana}`)).size,
    precos.length,
    'Chaves duplicadas',
  );
  assert.equal(precos.length, manifesto.contagens.precos);
  assert.equal(lacunas, manifesto.contagens.lacunas);
  assert.equal(precos.length + lacunas, manifesto.contagens.combinacoesPossiveis);
  assert.equal(
    precos.filter((p) => p.semana === anterior).length,
    manifesto.contagens.precosSemanaAnterior,
  );
  assert.equal(
    precos.filter((p) => p.semana >= janela.inicio).length,
    manifesto.contagens.precosNaJanela,
  );
  const registros = (caso, semana) =>
    precos.filter(
      (p) =>
        p.semana === semana &&
        (!caso.perfilId || p.perfilId === caso.perfilId) &&
        (!caso.regiaoId || p.regiaoId === caso.regiaoId),
    );
  const media = (linhas) =>
    racional(
      linhas.reduce((s, p) => s + centavos(p.preco), 0n),
      BigInt(linhas.length) * 100n,
    );
  const conferirVariacao = (caso) => {
    const antes = registros(caso, caso.anterior);
    const depois = registros(caso, caso.atual);
    const a = media(antes);
    const b = media(depois);
    const absoluta = racional(b.n * a.d - a.n * b.d, b.d * a.d);
    const percentual = racional((b.n * a.d - a.n * b.d) * 100n, b.d * a.n);
    assert.equal(apresentar(absoluta, 2), caso.esperado.variacaoAbsoluta);
    assert.equal(apresentar(percentual, 1), caso.esperado.variacaoPercentual);
    return { antes, depois, a, b };
  };
  assert.equal(cenarios.casos.length, 9, 'Cenários incompletos');
  for (const caso of cenarios.casos) {
    try {
      const { esperado } = caso;
      switch (caso.id) {
        case 'CA03':
          assert.equal(
            apresentar(
              racional(centavos(caso.entrada.preco), centavos(caso.entrada.pesoReferencia)),
              2,
            ),
            esperado.precoPorKgPesoVivo,
          );
          break;
        case 'CA04': {
          const linhas = registros(caso, caso.semana);
          assert.equal(linhas.length, esperado.cobertura);
          assert.equal(regioes.length, esperado.totalRegioes);
          assert.equal(
            apresentar(
              racional(
                linhas.reduce((s, p) => s + centavos(p.preco), 0n),
                100n,
              ),
              2,
            ),
            esperado.somaPrecos,
          );
          assert.equal(apresentar(media(linhas), 2), esperado.mediaEstadual);
          break;
        }
        case 'CA05':
          assert.equal(registros(caso, caso.semana).length, esperado.registros);
          assert.equal(esperado.mediaEstadual, null);
          break;
        case 'CA06': {
          const { antes, depois } = conferirVariacao(caso);
          assert.equal(antes[0].preco, esperado.precoAnterior);
          assert.equal(depois[0].preco, esperado.precoAtual);
          break;
        }
        case 'CA07-semana-ausente':
          assert.equal(registros(caso, caso.anterior).length, 0);
          assert(registros(caso, caso.atual).length > 0);
          assert.equal(esperado.variacaoSemanal, null);
          break;
        case 'CA07-periodo-unico':
          assert.equal(caso.inicio, caso.fim);
          assert(registros(caso, caso.inicio).length > 0);
          assert.equal(esperado.variacaoPeriodo, null);
          break;
        case 'CA08': {
          const { antes, depois, a, b } = conferirVariacao(caso);
          assert.equal(apresentar(a, 2), esperado.mediaAnterior);
          assert.equal(apresentar(b, 2), esperado.mediaAtual);
          assert.equal(antes.length, esperado.coberturaAnterior);
          assert.equal(depois.length, esperado.coberturaAtual);
          assert.deepEqual(
            antes.map((p) => p.regiaoId),
            esperado.regioesAnteriores,
          );
          assert.deepEqual(
            depois.map((p) => p.regiaoId),
            esperado.regioesAtuais,
          );
          assert.equal(
            JSON.stringify(esperado.regioesAnteriores) !== JSON.stringify(esperado.regioesAtuais),
            esperado.composicaoAlterada,
          );
          break;
        }
        case 'RN07-limite-inferior':
          assert.equal(
            registros(caso, caso.anterior).length > 0 && registros(caso, caso.atual).length > 0,
            esperado.ambasReferenciasPresentes,
          );
          break;
        case 'lacuna-consecutiva':
          for (const semana of caso.semanas)
            assert.equal(registros(caso, semana).length, esperado.registros);
          break;
        default:
          throw new Error('Identificador de cenário desconhecido');
      }
    } catch (error) {
      throw new Error(`Cenário ${caso.id} divergente`, { cause: error });
    }
  }
  return `${precos.length} preços; ${lacunas} lacunas; ${municipios.length} municípios; ${cenarios.casos.length} cenários; ${somas.length} hashes`;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(verificarBase(process.argv[2]));
}
