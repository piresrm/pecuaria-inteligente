import { spawnSync } from 'node:child_process';
import { runtimeIdentity, assertRuntimePolicy } from './runtime-policy.mjs';
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
const action = process.argv[2];
const args =
  action === 'up'
    ? ['up', '-d', '--build', '--wait', '--wait-timeout', '180']
    : action === 'down'
      ? ['down']
      : action === 'publish'
        ? ['--profile', 'operacoes', 'run', '--rm', 'publicar']
        : undefined;
if (!args) throw new Error('Ação local inválida');
const result = spawnSync('docker', ['compose', ...args], { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
