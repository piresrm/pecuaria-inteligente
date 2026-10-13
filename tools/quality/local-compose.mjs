import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runtimeIdentity, assertRuntimePolicy } from './runtime-policy.mjs';

export function localComposeCommands(action) {
  if (action === 'up')
    return [
      ['up', '-d', '--wait', '--wait-timeout', '180', 'postgres'],
      ['exec', '-T', 'postgres', '/docker-entrypoint-initdb.d/10-roles.sh'],
      ['up', '-d', '--build', '--wait', '--wait-timeout', '180'],
    ];
  if (action === 'down') return [['down']];
  if (action === 'publish') return [['--profile', 'operacoes', 'run', '--rm', 'publicar']];
  throw new Error('Ação local inválida');
}

function run(action) {
  const env = { ...process.env, ...runtimeIdentity() };
  const configured = spawnSync('docker', ['compose', 'config', '--format', 'json'], {
    env,
    encoding: 'utf8',
  });
  if (configured.error) throw configured.error;
  if (configured.status !== 0) throw new Error(configured.stderr);
  assertRuntimePolicy(JSON.parse(configured.stdout), {
    inspectSecretFiles: true,
    allowNonLoopbackEntry: process.env.ALLOW_LAN === '1',
  });
  for (const args of localComposeCommands(action)) {
    const result = spawnSync('docker', ['compose', ...args], { env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) return result.status ?? 1;
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = run(process.argv[2]);
