import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateRuleCases } from './avaliar.mjs';
import { runSemgrepContainer } from './executor.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(await readFile(resolve(root, 'tools/semgrep/manifesto.json'), 'utf8'));
const cases = JSON.parse(await readFile(resolve(root, 'tools/semgrep/casos-semgrep.json'), 'utf8'));
const cacheRoot = resolve(root, '.cache/semgrep', manifest.origem.revisao);
const configs = [resolve(root, manifest.regrasProprias.arquivoPlanejado)];
for (const rule of manifest.regrasComunitarias)
  configs.push(resolve(cacheRoot, rule.caminhoOrigem));
const temporaryRoot = resolve(root, 'tests/semgrep-cases');
await mkdir(temporaryRoot, { recursive: true });
const temporary = await mkdtemp(`${temporaryRoot}/run-`);
await chmod(temporary, 0o755);
try {
  for (const testCase of cases) {
    const casePath = resolve(temporary, testCase.id, basename(testCase.caminho));
    if (!casePath.startsWith(`${temporary}/`))
      throw new Error(`caso fora do diretório temporário: ${testCase.id}`);
    await mkdir(dirname(casePath), { recursive: true });
    await writeFile(casePath, testCase.conteudo);
  }
  const runDirectory = temporary.slice(root.length + 1);
  const expectedTargets = cases.map(
    (testCase) => `${runDirectory}/${testCase.id}/${basename(testCase.caminho)}`,
  );
  const expectedFindings = cases
    .filter((testCase) => testCase.deveEncontrar)
    .map(
      (testCase) =>
        `${runDirectory}/${testCase.id}/${basename(testCase.caminho)}\0${testCase.regraId}`,
    );
  const execution = runSemgrepContainer({
    root,
    manifest,
    configs: configs.map((path) => path.replace(`${root}/`, '/src/')),
    targets: [`/src/${runDirectory}`],
    outputBase: 'artifacts/security/semgrep-rules-raw',
    errorOnFindings: false,
    timeoutMs: 8 * 60 * 1000,
  });
  const result = evaluateRuleCases({
    rawPath: execution.rawPath,
    expectedTargets,
    expectedFindings,
    rawExitCode: execution.rawExitCode,
  });
  result.casesFixos = cases.length;
  result.comunitarias = manifest.regrasComunitarias.length;
  result.proprias = manifest.regrasProprias.ids.length;
  await writeFile(
    resolve(root, 'artifacts/security/semgrep-rules-decision.json'),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
