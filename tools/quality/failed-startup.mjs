import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
export async function verifyFailedStartup(args, env, results) {
  for (const service of ['migrar', 'preparar']) {
    const override = `${env.TRUST_DIR}/failure-${service}.yaml`;
    await writeFile(override, `services:\n  ${service}:\n    command: [arquivo-inexistente.js]\n`);
    const startup = spawnSync(
      'docker',
      [...args, '-f', override, 'up', '-d', '--wait', '--wait-timeout', '180'],
      { env, encoding: 'utf8' },
    );
    if (startup.error) throw startup.error;
    await writeFile(
      `${results}/failure-${service}.log`,
      `$ docker ${[...args, '-f', override, 'up', '-d', '--wait', '--wait-timeout', '180'].join(' ')}\n${startup.stdout}${startup.stderr}\nCódigo: ${startup.status}\n`,
    );
    if (startup.status === 0) throw new Error(`Falha de ${service} disponibilizou aplicação`);
    const state = spawnSync('docker', [...args, 'ps', '--all', '--format', 'json'], {
      env,
      encoding: 'utf8',
    });
    if (state.status !== 0) throw new Error('Estado de falha não foi obtido');
    await writeFile(`${results}/failure-${service}-state.json`, state.stdout);
    const raw = state.stdout.trim();
    const rows = raw.startsWith('[')
      ? JSON.parse(raw)
      : raw
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line));
    const failedService = rows.find((row) => row.Service === service);
    if (!failedService || failedService.State !== 'exited' || failedService.ExitCode !== 1)
      throw new Error(`Falha deliberada de ${service} não comprovada`);
    if (rows.some((row) => row.Service === 'entrada' && row.State === 'running'))
      throw new Error(`Entrada disponível após falha de ${service}`);
    const logs = spawnSync('docker', [...args, 'logs', '--no-color'], { env, encoding: 'utf8' });
    await writeFile(`${results}/failure-${service}-services.log`, logs.stdout + logs.stderr);
    const cleanup = spawnSync('docker', [...args, 'down', '--volumes', '--remove-orphans'], {
      env,
      stdio: 'inherit',
    });
    if (cleanup.status !== 0) throw new Error('Limpeza exclusiva de falha não concluída');
  }
}
