import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readExceptionGroups } from './exceptions.mjs';

const readJson = (path, label) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label}: JSON inválido (${error.message})`);
  }
};

const advisoryList = (packageName, report, visited = new Set()) => {
  if (visited.has(packageName)) return [];
  visited.add(packageName);
  const item = report.vulnerabilities?.[packageName];
  if (!item) return [];
  return (Array.isArray(item.via) ? item.via : []).flatMap((via) => {
    if (typeof via === 'string') return advisoryList(via, report, visited);
    if (typeof via !== 'object' || via === null || typeof via.source !== 'number') return [];
    const title = String(via.title ?? '');
    const url = String(via.url ?? '');
    const ghsa = url.match(/GHSA-[a-z0-9-]+/i)?.[0] ?? title.match(/GHSA-[a-z0-9-]+/i)?.[0];
    return [
      { id: ghsa ?? String(via.source), title, url, range: String(via.range ?? item.range ?? '') },
    ];
  });
};

const expand = (report, packageLock = {}) =>
  Object.entries(report.vulnerabilities ?? {}).flatMap(([packageName, item]) => {
    const advisories = advisoryList(packageName, report);
    const nodes = (Array.isArray(item.nodes) ? item.nodes : []).map((node) => {
      if (typeof node !== 'string') return node;
      return {
        path: node,
        version: packageLock.packages?.[node]?.version ?? '',
        developmentDependency: packageLock.packages?.[node]?.dev === true,
      };
    });
    if (!advisories.length)
      return [
        {
          packageName,
          version: nodes[0]?.version ?? '',
          path: nodes[0]?.path ?? '',
          severity: item.severity,
          isDirect: item.isDirect === true,
          developmentDependency: nodes[0]?.developmentDependency === true,
          advisory: 'unknown',
          title: '',
          url: '',
          range: item.range ?? '',
        },
      ];
    return advisories.flatMap((advisory) =>
      (nodes.length ? nodes : [{ version: '', path: '' }]).map((node) => ({
        packageName,
        version: String(node.version ?? ''),
        path: String(node.path ?? ''),
        severity: item.severity,
        isDirect: item.isDirect === true,
        developmentDependency: node.developmentDependency === true,
        ...advisory,
        advisory: advisory.id,
      })),
    );
  });

export function findingFingerprint(finding) {
  const relevant = [
    finding.advisory,
    finding.packageName,
    finding.version,
    finding.path,
    finding.title,
    finding.url,
    finding.range,
  ];
  return createHash('sha256').update(JSON.stringify(relevant)).digest('hex');
}

function validateException(exception, findings, date) {
  const required = [
    'id',
    'pacote',
    'versao',
    'caminho',
    'motivo',
    'evidencia',
    'revisor',
    'expiraEm',
    'sha256Trecho',
  ];
  if (
    !exception ||
    required.some((key) => typeof exception[key] !== 'string' || exception[key].trim() === '')
  )
    throw new Error('exceção de auditoria inválida: campos obrigatórios ausentes');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.expiraEm) || exception.expiraEm < date)
    throw new Error(`exceção vencida: ${exception.id}`);
  const matched = findings.find(
    (finding) =>
      finding.advisory === exception.id &&
      finding.packageName === exception.pacote &&
      finding.version === exception.versao &&
      finding.path === exception.caminho,
  );
  if (!matched)
    throw new Error(
      `exceção sem achado correspondente: ${exception.id} (${JSON.stringify(findings)})`,
    );
  if (findingFingerprint(matched) !== exception.sha256Trecho)
    throw new Error(`hash da exceção diverge do achado: ${exception.id}`);
  return matched;
}

export function evaluateAudit({
  rawPath,
  exceptionsPath,
  rawExitCode = 0,
  packageLock = {},
  date = new Date().toISOString().slice(0, 10),
}) {
  if (!Number.isInteger(rawExitCode) || rawExitCode !== 0)
    throw new Error(`npm audit terminou com código bruto ${rawExitCode}`);
  const report = readJson(rawPath, 'relatório bruto do npm audit');
  const exceptions = readExceptionGroups(exceptionsPath).audit;
  const counts = report?.metadata?.vulnerabilities;
  if (
    !counts ||
    !['info', 'low', 'moderate', 'high', 'critical', 'total'].every(
      (key) => Number.isInteger(counts[key]) && counts[key] >= 0,
    )
  )
    throw new Error('inventário de vulnerabilidades ausente ou inválido');
  if (
    !report.vulnerabilities ||
    typeof report.vulnerabilities !== 'object' ||
    Array.isArray(report.vulnerabilities)
  )
    throw new Error('inventário detalhado ausente ou inválido');
  const findings = expand(report, packageLock);
  const packageCounts = Object.values(report.vulnerabilities).reduce(
    (acc, item) => {
      if (!item || !['info', 'low', 'moderate', 'high', 'critical'].includes(item.severity))
        throw new Error('inventário contém severidade inválida');
      acc[item.severity] += 1;
      return acc;
    },
    { info: 0, low: 0, moderate: 0, high: 0, critical: 0 },
  );
  const countsTotal = counts.info + counts.low + counts.moderate + counts.high + counts.critical;
  if (
    counts.total !== countsTotal ||
    Object.values(packageCounts).reduce((a, b) => a + b, 0) !==
      Object.keys(report.vulnerabilities).length ||
    Object.entries(packageCounts).some(([key, value]) => value !== counts[key])
  )
    throw new Error('inventário de metadados e pacotes inconsistente');
  const exceptionFindings = exceptions.map((exception) =>
    validateException(exception, findings, date),
  );
  const exceptionKeys = new Set(
    exceptionFindings.map(
      (finding) =>
        `${finding.advisory}\0${finding.packageName}\0${finding.version}\0${finding.path}`,
    ),
  );
  const uncovered = findings.filter(
    (finding) =>
      ['high', 'critical'].includes(finding.severity) &&
      !exceptionKeys.has(
        `${finding.advisory}\0${finding.packageName}\0${finding.version}\0${finding.path}`,
      ),
  );
  if (uncovered.length)
    throw new Error(
      `achados altos/críticos sem exceção revisada: ${uncovered.map((f) => `${f.advisory}:${f.packageName}@${f.version}`).join(', ')}`,
    );
  return {
    aprovado: true,
    contagens: counts,
    achados: findings,
    excecoesAplicadas: exceptionFindings.length,
    observacao: 'Severidades moderadas e baixas permanecem no relatório bruto e nesta decisão.',
  };
}

export function writeDecision(result, path) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`);
}

function runAudit() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const outputDirectory = resolve(root, 'artifacts/security');
  const rawPath = resolve(outputDirectory, 'npm-audit-raw.json');
  const metaPath = resolve(outputDirectory, 'npm-audit-meta.json');
  const decisionPath = resolve(outputDirectory, 'npm-audit-decision.json');
  mkdirSync(outputDirectory, { recursive: true });
  const audit = spawnSync('npm', ['audit', '--include=dev', '--audit-level=high', '--json'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    timeout: 8 * 60 * 1000,
  });
  const raw = audit.stdout ?? '';
  writeFileSync(rawPath, raw);
  const npmVersion = spawnSync('npm', ['--version'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
  });
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
  });
  const lock = readFileSync(resolve(root, 'package-lock.json'));
  const packageLock = JSON.parse(lock.toString('utf8'));
  const metadata = {
    geradoEm: new Date().toISOString(),
    npm: npmVersion.stdout?.trim() ?? null,
    revisao: revision.status === 0 ? revision.stdout.trim() : null,
    sha256PackageLock: createHash('sha256').update(lock).digest('hex'),
    codigoBruto: Number.isInteger(audit.status) ? audit.status : null,
    sinalBruto: audit.signal ?? null,
    erroBruto: audit.error?.message ?? null,
    stderrBruto: audit.stderr ?? '',
  };
  writeDecision(metadata, metaPath);
  try {
    const result = evaluateAudit({
      rawPath,
      exceptionsPath: resolve(root, 'docs/qualidade/excecoes.json'),
      rawExitCode: metadata.codigoBruto,
      packageLock,
    });
    result.metadata = metadata;
    writeDecision(result, decisionPath);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    const result = { aprovado: false, motivo: error.message, metadata };
    writeDecision(result, decisionPath);
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runAudit();
