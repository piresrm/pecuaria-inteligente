import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
if (process.argv[2] !== 'test') {
  console.info(
    'Extração: docker compose cp entrada:/data/caddy/pki/authorities/local/root.crt .local/root.crt',
  );
  console.info('Confiança e remoção: consulte README.md. Este comando não altera o sistema.');
} else {
  if (
    !existsSync('/.dockerenv') ||
    process.env.E2E_RUNTIME_CONTAINER !== '1' ||
    process.env.HOME !== '/home/node'
  )
    throw new Error(
      'Confiança de testes exige contêiner descartável e perfil interno do contêiner',
    );
  const nss = '/home/node/.pki/nssdb';
  mkdirSync(nss, { recursive: true });
  execFileSync('certutil', ['-N', '--empty-password', '-d', `sql:${nss}`]);
  execFileSync('certutil', [
    '-A',
    '-d',
    `sql:${nss}`,
    '-n',
    'Pecuaria teste',
    '-t',
    'C,,',
    '-i',
    '/trust/root.crt',
  ]);
  const result = spawnSync('npm', ['exec', '--', 'playwright', 'test'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
