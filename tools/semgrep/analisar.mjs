import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readExceptionGroups } from '../quality/exceptions.mjs';
import { evaluateSemgrep } from './avaliar.mjs';
import { listScanTargets } from './alvos.mjs';
import { runSemgrepContainer } from './executor.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = resolve(root, 'tools/semgrep/manifesto.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const cacheRoot = resolve(root, '.cache/semgrep', manifest.origem.revisao);
const exceptionsPath = resolve(root, 'docs/qualidade/excecoes.json');
const exceptions = readExceptionGroups(exceptionsPath).semgrep;
const configs = [resolve(root, manifest.regrasProprias.arquivoPlanejado)];
for (const rule of manifest.regrasComunitarias) {
  const path = resolve(cacheRoot, rule.caminhoOrigem);
  const content = await readFile(path);
  const actual = createHash('sha256').update(content).digest('hex');
  if (actual !== rule.sha256) throw new Error(`hash divergente para regra pinada ${rule.id}`);
  configs.push(path);
}
const targets = listScanTargets(root);
const execution = runSemgrepContainer({
  root,
  manifest,
  configs: configs.map((path) => path.replace(`${root}/`, '/src/')),
  targets: targets.map((path) => `/src/${path}`),
  outputBase: 'artifacts/security/semgrep-raw',
  errorOnFindings: true,
});
const inventory = {
  geradoEm: new Date().toISOString(),
  revisao: manifest.origem.revisao,
  executor: manifest.executor,
  alvoEsperado: targets,
  hashesComunitarios: manifest.regrasComunitarias.map(({ id, sha256 }) => ({ id, sha256 })),
  timeoutPorRegraArquivoSegundos: 10,
  tamanhoMaximoArquivoBytes: 1_048_576,
  codigoBruto: execution.rawExitCode,
  erroSpawn: execution.spawnError,
};
await mkdir(resolve(root, 'artifacts/security'), { recursive: true });
await writeFile(
  resolve(root, 'artifacts/security/semgrep-inventory.json'),
  `${JSON.stringify(inventory, null, 2)}\n`,
);
try {
  const decision = evaluateSemgrep({
    rawPath: execution.rawPath,
    expectedTargets: targets,
    exceptions,
    rawExitCode: execution.rawExitCode,
    sourceRoot: root,
  });
  decision.inventario = inventory;
  await writeFile(
    resolve(root, 'artifacts/security/semgrep-decision.json'),
    `${JSON.stringify(decision, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
} catch (error) {
  const decision = { aprovado: false, motivo: error.message, inventario: inventory };
  await writeFile(
    resolve(root, 'artifacts/security/semgrep-decision.json'),
    `${JSON.stringify(decision, null, 2)}\n`,
  );
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
