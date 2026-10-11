import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isAbsolute, normalize, relative, resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`JSON Semgrep inválido (${error.message})`);
  }
}

export function verifyPinnedContent(bytes, expectedSha256) {
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (!/^[a-f0-9]{64}$/.test(expectedSha256) || actual !== expectedSha256)
    throw new Error(`hash divergente: esperado ${expectedSha256}, obtido ${actual}`);
  return actual;
}

function targetName(target) {
  const normalized = normalize(target).replaceAll('\\', '/');
  if (normalized === '/src') return '.';
  if (normalized.startsWith('/src/')) return normalized.slice('/src/'.length);
  if (normalized === '/cases') return '.';
  if (normalized.startsWith('/cases/')) return normalized.slice('/cases/'.length);
  if (isAbsolute(normalized)) return relative('/src', normalized).replaceAll('\\', '/');
  return normalized.replace(/^\.\//, '');
}

export function findingFingerprint(result, sourceRoot) {
  let snippet = result.extra?.lines ?? '';
  if (
    sourceRoot &&
    Number.isInteger(result.start?.offset) &&
    Number.isInteger(result.end?.offset)
  ) {
    const sourcePath = resolve(sourceRoot, targetName(result.path));
    const source = readFileSync(sourcePath);
    snippet = source.subarray(result.start.offset, result.end.offset).toString('utf8');
  }
  return createHash('sha256')
    .update(
      JSON.stringify([result.check_id, targetName(result.path), result.start?.line ?? 0, snippet]),
    )
    .digest('hex');
}

function exceptionMatches(exception, result, date, sourceRoot) {
  const required = [
    'regraId',
    'caminho',
    'sha256Trecho',
    'motivo',
    'evidencia',
    'revisor',
    'expiraEm',
  ];
  if (
    !exception ||
    required.some((key) => typeof exception[key] !== 'string' || exception[key].trim() === '')
  )
    throw new Error('exceção Semgrep inválida: campos obrigatórios ausentes');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.expiraEm) || exception.expiraEm < date)
    throw new Error(`exceção Semgrep vencida: ${exception.regraId}`);
  if (exception.regraId !== result.check_id || exception.caminho !== targetName(result.path))
    return false;
  if (exception.sha256Trecho !== findingFingerprint(result, sourceRoot))
    throw new Error(`hash da exceção Semgrep diverge do trecho: ${exception.regraId}`);
  return true;
}

export function evaluateSemgrep({
  rawPath,
  expectedTargets,
  exceptions = [],
  rawExitCode = 0,
  date = new Date().toISOString().slice(0, 10),
  sourceRoot,
}) {
  if (!Number.isInteger(rawExitCode) || rawExitCode < 0 || rawExitCode > 1)
    throw new Error(`Semgrep terminou com código bruto de execução ${rawExitCode}`);
  const report = readJson(rawPath);
  if (!Array.isArray(expectedTargets) || !Array.isArray(exceptions))
    throw new Error('inventário e exceções devem ser listas');
  if (
    !Array.isArray(report.results) ||
    !Array.isArray(report.errors) ||
    !report.paths ||
    !Array.isArray(report.paths.scanned)
  )
    throw new Error('relatório Semgrep sem resultados, erros ou inventário de alvos');
  if (report.errors.length)
    throw new Error(
      `Semgrep reportou erro de análise: ${report.errors.map((error) => error.message ?? JSON.stringify(error)).join('; ')}`,
    );
  const expected = new Set(expectedTargets.map(targetName));
  const scanned = new Set(report.paths.scanned.map(targetName));
  const omitted = [...expected].filter((target) => !scanned.has(target));
  const unexpectedTargets = [...scanned].filter((target) => !expected.has(target));
  if (omitted.length || unexpectedTargets.length)
    throw new Error(
      `inventário de alvos divergente; ignorados: ${omitted.join(', ') || 'nenhum'}; extras: ${unexpectedTargets.join(', ') || 'nenhum'}`,
    );
  const applied = new Set();
  const uncovered = [];
  for (const result of report.results) {
    const matchIndex = exceptions.findIndex(
      (exception, index) =>
        !applied.has(index) && exceptionMatches(exception, result, date, sourceRoot),
    );
    if (matchIndex === -1) uncovered.push(result);
    else applied.add(matchIndex);
  }
  if (applied.size !== exceptions.length)
    throw new Error('exceção Semgrep sem achado correspondente');
  if (uncovered.length)
    throw new Error(
      `achados Semgrep sem exceção válida: ${uncovered.map((result) => `${result.check_id}:${targetName(result.path)}:${result.start?.line ?? 0}`).join(', ')}`,
    );
  if (
    (report.results.length === 0 && rawExitCode !== 0) ||
    (report.results.length > 0 && rawExitCode !== 1)
  )
    throw new Error(
      `código bruto Semgrep ${rawExitCode} não corresponde ao número de achados ${report.results.length}`,
    );
  return {
    aprovado: true,
    codigoBruto: rawExitCode,
    alvosEsperados: expectedTargets.length,
    alvosAnalisados: scanned.size,
    achados: report.results.length,
    excecoesAplicadas: applied.size,
  };
}

export function evaluateRuleCases({ rawPath, expectedTargets, expectedFindings, rawExitCode = 0 }) {
  if (rawExitCode !== 0)
    throw new Error(`executor dos casos Semgrep terminou com código bruto ${rawExitCode}`);
  const report = readJson(rawPath);
  if (
    !Array.isArray(report.results) ||
    !Array.isArray(report.errors) ||
    !report.paths ||
    !Array.isArray(report.paths.scanned)
  )
    throw new Error('relatório dos casos Semgrep sem inventário completo');
  if (report.errors.length)
    throw new Error(
      `erro ao analisar casos Semgrep: ${report.errors.map((error) => error.message ?? JSON.stringify(error)).join('; ')}`,
    );
  const expected = new Set(expectedTargets.map(targetName));
  const scanned = new Set(report.paths.scanned.map(targetName));
  const missing = [...expected].filter((target) => !scanned.has(target));
  const extra = [...scanned].filter((target) => !expected.has(target));
  if (missing.length || extra.length)
    throw new Error(
      `inventário de casos divergente; ignorados: ${missing.join(', ') || 'nenhum'}; extras: ${extra.join(', ') || 'nenhum'}`,
    );
  const expectedSet = new Set(expectedFindings);
  const actualSet = new Set(
    report.results.map((result) => `${targetName(result.path)}\0${result.check_id}`),
  );
  if (actualSet.size !== report.results.length)
    throw new Error('casos Semgrep produziram achados duplicados para o mesmo par de regra e alvo');
  const unexpected = [...actualSet].filter((finding) => !expectedSet.has(finding));
  const absent = [...expectedSet].filter((finding) => !actualSet.has(finding));
  if (unexpected.length || absent.length)
    throw new Error(
      `casos Semgrep divergentes; ausentes: ${absent.join(', ') || 'nenhum'}; inesperados: ${unexpected.join(', ') || 'nenhum'}`,
    );
  return {
    aprovado: true,
    casos: expectedSet.size,
    alvosEsperados: expectedTargets.length,
    alvosAnalisados: scanned.size,
    achadosEsperados: expectedSet.size,
    achados: report.results.length,
  };
}
