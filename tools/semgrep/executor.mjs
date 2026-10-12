import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export function runSemgrepContainer({
  root,
  manifest,
  configs,
  targets,
  outputBase,
  timeoutMs = 8 * 60 * 1000,
  extraMounts = [],
  errorOnFindings = true,
}) {
  const outputPath = resolve(root, `${outputBase}.json`);
  const exitPath = resolve(root, `${outputBase}-exit.json`);
  const stderrPath = resolve(root, `${outputBase}-stderr.txt`);
  mkdirSync(dirname(outputPath), { recursive: true });
  const image = manifest.executor.imagem;
  const args = [
    'run',
    '--rm',
    '--pull=missing',
    '--network=none',
    '--read-only',
    '--tmpfs',
    '/tmp:size=128m,noexec,nosuid,nodev',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges:true',
    '--memory=2g',
    '--cpus=2',
    '-e',
    'HOME=/tmp',
    '-v',
    `${root}:/src:ro`,
    '-w',
    '/tmp',
  ];
  for (const mount of extraMounts) args.push('-v', mount);
  args.push(
    image,
    'semgrep',
    'scan',
    '--strict',
    '--disable-nosem',
    '--no-rewrite-rule-ids',
    '--metrics=off',
    '--disable-version-check',
    '--json',
    '--timeout',
    '10',
    '--timeout-threshold',
    '1',
    '--max-target-bytes',
    '1048576',
    '--no-git-ignore',
  );
  if (errorOnFindings) args.push('--error');
  for (const config of configs) args.push('--config', config);
  args.push(...targets);
  const result = spawnSync('docker', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    timeout: timeoutMs,
  });
  writeFileSync(outputPath, result.stdout ?? '');
  writeFileSync(stderrPath, result.stderr ?? result.error?.message ?? '');
  const rawExitCode = Number.isInteger(result.status) ? result.status : null;
  writeFileSync(
    exitPath,
    `${JSON.stringify({ codigoBruto: rawExitCode, sinal: result.signal ?? null, erro: result.error?.message ?? null, comando: ['docker', ...args] }, null, 2)}\n`,
  );
  return {
    rawPath: outputPath,
    exitPath,
    stderrPath,
    rawExitCode,
    spawnError: result.error?.message ?? null,
  };
}
