import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = resolve(root, 'tools/semgrep/manifesto.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const cacheRoot = resolve(root, '.cache/semgrep', manifest.origem.revisao);
const pinnedImage = manifest.executor.imagem;

if (
  !/^semgrep\/semgrep:1\.179\.0@sha256:[a-f0-9]{64}$/.test(pinnedImage) ||
  manifest.executor.versao !== '1.179.0'
)
  throw new Error('imagem do executor não corresponde à versão fixada');
if (manifest.origem.licenca.redistribuir !== false)
  throw new Error('manifesto deve proibir redistribuição das regras comunitárias');

const equivalents = [
  ['tools/semgrep/manifesto.json', 'docs/superpowers/quality/v0.1/semgrep-selecao.json'],
  ['tools/semgrep/casos-semgrep.json', 'docs/superpowers/quality/v0.1/casos-semgrep.json'],
  [
    manifest.regrasProprias.arquivoPlanejado,
    'docs/superpowers/quality/v0.1/regras-proprias.exemplo.yaml',
  ],
];
for (const [planned, reference] of equivalents) {
  const [plannedBytes, referenceBytes] = await Promise.all([
    readFile(resolve(root, planned)),
    readFile(resolve(root, reference)),
  ]);
  if (!plannedBytes.equals(referenceBytes))
    throw new Error(`arquivo de seleção diverge da referência: ${planned}`);
}

function rawUrl(path) {
  return `https://raw.githubusercontent.com/semgrep/semgrep-rules/${manifest.origem.revisao}/${path}`;
}

async function materialize(path, expectedHash, destination) {
  const response = await fetch(rawUrl(path), {
    signal: AbortSignal.timeout(20_000),
    redirect: 'error',
  });
  if (!response.ok)
    throw new Error(`download oficial falhou para ${path}: HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length === 0 || body.length > 1_048_576)
    throw new Error(`tamanho inválido para ${path}`);
  const actualHash = createHash('sha256').update(body).digest('hex');
  if (actualHash !== expectedHash)
    throw new Error(`SHA-256 divergente para ${path}: ${actualHash}`);
  const target = resolve(cacheRoot, destination);
  if (!target.startsWith(`${cacheRoot}${sep}`))
    throw new Error(`caminho fora do cache: ${destination}`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body, { flag: 'wx' }).catch(async (error) => {
    if (error.code !== 'EEXIST') throw error;
    const existing = await readFile(target);
    if (createHash('sha256').update(existing).digest('hex') !== expectedHash)
      throw new Error(`arquivo de cache preexistente tem hash divergente: ${destination}`);
  });
  return { caminho: target.slice(root.length + 1), sha256: actualHash, bytes: body.length };
}

const inventory = [];
inventory.push(
  await materialize(
    manifest.origem.licenca.arquivoOrigem,
    manifest.origem.licenca.sha256Arquivo,
    'LICENSE',
  ),
);
for (const rule of manifest.regrasComunitarias)
  inventory.push(await materialize(rule.caminhoOrigem, rule.sha256, rule.caminhoOrigem));
const report = {
  versaoManifesto: manifest.versaoFormato,
  revisao: manifest.origem.revisao,
  imagem: pinnedImage,
  redistribuicao: false,
  inventario: inventory,
};
const outputPath = resolve(root, 'artifacts/security/semgrep-rules-pins.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
