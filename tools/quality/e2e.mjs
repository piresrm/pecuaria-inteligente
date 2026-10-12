import { randomBytes } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, writeFile, symlink, chmod, cp, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { appendFileSync, openSync, closeSync } from 'node:fs';
import { prepareSecrets } from './local-prepare.mjs';
import { runtimeIdentity, assertRuntimePolicy } from './runtime-policy.mjs';
const project = `pecuaria-e2e-${randomBytes(6).toString('hex')}`;
const directory = resolve(`.local/e2e/${project}`);
const results = resolve(`artifacts/e2e/${project}`);
await mkdir(directory, { recursive: true });
await mkdir(results, { recursive: true });
await chmod(results, 0o777);
const subnetIndex = 20 + Math.floor(Math.random() * 200);
const env = {
  ...process.env,
  COMPOSE_PROJECT_NAME: project,
  ...runtimeIdentity(),
  SECRETS_DIR: `${directory}/secrets`,
  TRUST_DIR: `${directory}/trust`,
  DEMO_DIR: `${directory}/demo`,
  RESULTS_DIR: results,
  CADDY_IP: `172.29.${subnetIndex}.2`,
  LOCAL_SUBNET: `172.29.${subnetIndex}.0/24`,
  LOCAL_DYNAMIC_RANGE: `172.29.${subnetIndex}.128/25`,
  HTTP_PORT: '0',
  HTTPS_PORT: '0',
};
const args = ['compose', '-p', project, '-f', 'compose.yaml', '-f', 'compose.test.yaml'];
const executorLog = `${results}/executor.log`;
await writeFile(executorLog, `Projeto isolado: ${project}\n`);
function docker(tail, capture = false) {
  return runDocker([...args, ...tail], capture);
}
function runDocker(command, capture = false) {
  appendFileSync(executorLog, `\n$ docker ${command.join(' ')}\n`);
  const logFile = capture ? undefined : openSync(executorLog, 'a');
  const result = spawnSync('docker', command, {
    env,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : ['inherit', logFile, logFile],
    maxBuffer: 16777216,
  });
  if (logFile !== undefined) closeSync(logFile);
  if (capture) appendFileSync(executorLog, result.stdout + result.stderr);
  appendFileSync(
    executorLog,
    `\nCódigo: ${result.status}; erro: ${result.error?.message ?? 'nenhum'}\n`,
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `docker ${command.join(' ')} falhou: ${result.status} ${capture ? result.stderr : ''}`,
    );
  return result.stdout;
}
let failed = false;
try {
  docker(['version'], true);
  await prepareSecrets(env.SECRETS_DIR);
  await mkdir(env.TRUST_DIR, { recursive: true });
  await cp('data/demonstrativa/v0.1', env.DEMO_DIR, { recursive: true });
  const version = `e2e-publicacao-${randomBytes(6).toString('hex')}`;
  for (const name of ['manifesto.json', 'cenarios.json', 'precos.csv']) {
    const file = `${env.DEMO_DIR}/${name}`;
    await writeFile(
      file,
      (await readFile(file, 'utf8')).replaceAll('go-reposicao-demo-2026-10-07-r1', version),
    );
  }
  const { createHash } = await import('node:crypto');
  const files = [
    'cenarios.json',
    'manifesto.json',
    'perfis.json',
    'precos.csv',
    'receita.json',
    'regioes.json',
  ];
  const hashes = await Promise.all(
    files.map(
      async (name) =>
        `${createHash('sha256')
          .update(await readFile(`${env.DEMO_DIR}/${name}`))
          .digest('hex')}  ${name}\n`,
    ),
  );
  await writeFile(`${env.DEMO_DIR}/SHA256SUMS`, hashes.join(''));
  const config = docker(['--profile', 'testes', 'config', '--format', 'json'], true);
  await writeFile(`${results}/compose.json`, config);
  const effective = JSON.parse(config);
  assertRuntimePolicy(effective, { inspectSecretFiles: true });
  docker(['--profile', 'testes', 'build']);
  docker(['up', '-d', '--wait', '--wait-timeout', '180']);
  function verifyPostgresRuntime() {
    const [uid, gid] = docker(
      [
        'exec',
        '-T',
        'postgres',
        'sh',
        '-ec',
        'id -u; id -g; for name in admin migracao publicador consulta; do test -r /run/secrets/$name; done',
      ],
      true,
    )
      .trim()
      .split('\n');
    if (uid !== env.RUNTIME_UID || gid !== env.RUNTIME_GID)
      throw new Error('PostgreSQL não usa a identidade proprietária dos segredos');
    const roles = JSON.parse(
      docker(
        [
          'exec',
          '-T',
          'postgres',
          'psql',
          '-U',
          'administrador',
          '-d',
          'mercado',
          '-At',
          '-c',
          "SELECT coalesce(json_agg(json_build_object('name', rolname, 'superuser', rolsuper, 'createdb', rolcreatedb, 'createrole', rolcreaterole, 'replication', rolreplication, 'bypassrls', rolbypassrls) ORDER BY rolname), '[]') FROM pg_roles WHERE rolname IN ('mercado_consulta', 'mercado_migracao', 'mercado_publicador')",
        ],
        true,
      ),
    );
    if (
      roles.length !== 3 ||
      roles.some(
        (role) =>
          role.superuser || role.createdb || role.createrole || role.replication || role.bypassrls,
      )
    )
      throw new Error('Papéis separados do banco não foram provisionados com privilégios mínimos');
    return { uid, gid, roles, secretsReadable: true };
  }
  const postgresRuntime = verifyPostgresRuntime();
  await writeFile(`${results}/postgres-runtime.json`, JSON.stringify(postgresRuntime, null, 2));
  const ids = docker(['ps', '--quiet', 'api', 'postgres', 'entrada'], true).trim().split('\n');
  const containers = JSON.parse(runDocker(['inspect', ...ids], true));
  for (const container of containers) {
    if (container.Config.Labels['com.docker.compose.project'] !== project)
      throw new Error('Inspeção exige projeto isolado');
    const service = container.Config.Labels['com.docker.compose.service'];
    const bindings = container.HostConfig.PortBindings ?? {};
    if (['api', 'postgres'].includes(service) && Object.keys(bindings).length)
      throw new Error(`Porta publicada diretamente: ${service}`);
    if (
      service === 'entrada' &&
      Object.entries(bindings).some(
        ([port, hosts]) =>
          !['80/tcp', '443/tcp'].includes(port) ||
          hosts.some((host) => host.HostIp !== '127.0.0.1'),
      )
    )
      throw new Error('Entrada publicou porta fora do loopback autorizado');
  }
  const entry = containers.find(
    (container) => container.Config.Labels['com.docker.compose.service'] === 'entrada',
  );
  const network = Object.values(entry.NetworkSettings.Networks).find(
    (candidate) => candidate.IPAddress === env.CADDY_IP,
  );
  if (!network) throw new Error('Entrada não participa da rede interna esperada');
  if (network.IPAddress !== env.CADDY_IP) throw new Error('Proxy não usa IP confiável definido');
  const networks = JSON.parse(runDocker(['network', 'inspect', network.NetworkID], true));
  if (!networks[0].Internal) throw new Error('Rede privada permite acesso externo direto');
  for (const container of containers) {
    const service = container.Config.Labels['com.docker.compose.service'];
    if (
      ['api', 'postgres'].includes(service) &&
      Object.values(container.NetworkSettings.Networks).some(
        (candidate) => candidate.NetworkID !== network.NetworkID,
      )
    )
      throw new Error(`Serviço conectado fora da rede interna: ${service}`);
  }
  const ports = entry.NetworkSettings.Ports;
  for (const port of ['80/tcp', '443/tcp']) {
    if (
      ports[port]?.length !== 1 ||
      ports[port][0].HostIp !== '127.0.0.1' ||
      !/^[1-9][0-9]*$/.test(ports[port][0].HostPort)
    )
      throw new Error(`Porta de entrada não publicada efetivamente no loopback: ${port}`);
  }
  await writeFile(
    `${results}/entry-ports.json`,
    JSON.stringify(
      {
        https: `https://localhost:${ports['443/tcp'][0].HostPort}`,
        http: `http://localhost:${ports['80/tcp'][0].HostPort}`,
        ports,
      },
      null,
      2,
    ),
  );
  const curlVersion = docker(['exec', '-T', 'entrada', 'curl', '--version'], true);
  if (!curlVersion.startsWith('curl 8.22.0 '))
    throw new Error('Versão curl diverge da base fixada');
  await writeFile(`${results}/caddy-curl.txt`, curlVersion);
  await writeFile(
    `${results}/isolation.json`,
    JSON.stringify({ containers, networks, hostBridgeReachable: true }, null, 2),
  );
  const images = docker(['images', '--format', 'json'], true);
  await writeFile(`${results}/images.json`, images);
  const runtime = docker(
    [
      'run',
      '--rm',
      '--no-deps',
      '--entrypoint',
      'node',
      'api',
      '-e',
      `
    const fs = require('node:fs');
    const unwanted = ['drizzle-kit','esbuild','tsx','react','react-dom','idb','big.js'].filter((name) => fs.existsSync('/app/node_modules/' + name));
    const result = { uid: process.getuid(), gid: process.getgid(), node: process.version, unwanted, operations: fs.existsSync('/app/apps/api/dist/operations'), demo: fs.existsSync('/app/apps/api/dist/demo') };
    console.log(JSON.stringify(result));
    if (result.uid !== ${env.RUNTIME_UID} || result.gid !== ${env.RUNTIME_GID} || unwanted.length || result.operations || result.demo) process.exitCode = 1;
  `,
    ],
    true,
  );
  await writeFile(`${results}/api-runtime.json`, runtime);
  docker(['cp', 'entrada:/data/caddy/pki/authorities/local/root.crt', `${env.TRUST_DIR}/root.crt`]);
  const hash = execFileSync(
    'openssl',
    ['x509', '-hash', '-noout', '-in', `${env.TRUST_DIR}/root.crt`],
    { encoding: 'utf8' },
  ).trim();
  await symlink('root.crt', `${env.TRUST_DIR}/${hash}.0`);
  await symlink('root.crt', `${env.TRUST_DIR}/ca-certificates.crt`);
  function probe(path) {
    return JSON.parse(
      docker(
        ['run', '--rm', '--no-deps', 'runner', 'node', 'tools/quality/https-probe.mjs', path],
        true,
      ),
    );
  }
  const first = probe('/api/v1/mercado/resumo');
  if (first.status !== 200) throw new Error('Primeiro início sem consulta');
  const firstSummary = JSON.parse(first.body);
  const historyPath = `/api/v1/mercado/historico?versaoDados=${firstSummary.versaoDados}&perfilId=${firstSummary.perfis[0].id}`;
  const oldHistory = probe(historyPath);
  docker(['down']);
  docker(['up', '-d', '--wait', '--wait-timeout', '180']);
  const postgresSecondStart = verifyPostgresRuntime();
  const second = probe('/api/v1/mercado/resumo');
  if (second.body !== first.body) throw new Error('Segundo início alterou publicação');
  docker(['--profile', 'operacoes', 'run', '--rm', 'publicar']);
  const published = probe('/api/v1/mercado/resumo');
  if (JSON.parse(published.body).versaoDados !== version)
    throw new Error('Publicação explícita não atualizou versão');
  if (probe(historyPath).body !== oldHistory.body)
    throw new Error('Publicação alterou histórico antigo');
  docker(['restart', 'postgres', 'api', 'entrada']);
  docker(['up', '-d', '--wait', '--wait-timeout', '180']);
  const postgresRestart = verifyPostgresRuntime();
  if (probe('/api/v1/mercado/resumo').body !== published.body)
    throw new Error('Reinício não preservou publicação');
  docker(['stop', 'postgres']);
  const unavailable = probe('/api/v1/mercado/resumo');
  if (unavailable.status !== 503 || unavailable.headers['cache-control'] !== 'no-store')
    throw new Error('Queda do banco não gera erro público sem cache');
  docker(['start', 'postgres']);
  docker(['up', '-d', '--wait', '--wait-timeout', '180']);
  await writeFile(
    `${results}/lifecycle.json`,
    JSON.stringify(
      {
        first,
        second,
        published,
        oldHistory,
        unavailable,
        postgresRuntime,
        postgresSecondStart,
        postgresRestart,
      },
      null,
      2,
    ),
  );
  docker(['run', '--rm', '--no-deps', 'runner']);
  await writeFile(
    `${results}/compose-state.json`,
    docker(['ps', '--all', '--format', 'json'], true),
  );
  await writeFile(`${results}/compose-success.log`, docker(['logs', '--no-color'], true));
  docker(['down', '--volumes', '--remove-orphans']);
  const { verifyFailedStartup } = await import('./failed-startup.mjs');
  await verifyFailedStartup(args, env, results);
} catch (error) {
  failed = true;
  appendFileSync(executorLog, `Falha: ${error.message}\n`);
  console.error(error.message);
} finally {
  try {
    await writeFile(`${results}/compose.log`, docker(['logs', '--no-color'], true));
  } catch (error) {
    console.error(error.message);
    failed = true;
  }
  try {
    docker(['down', '--volumes', '--remove-orphans']);
  } catch (error) {
    console.error(error.message);
    failed = true;
  }
}
await writeFile(
  `${results}/outcome.json`,
  JSON.stringify({ project, exitCode: failed ? 1 : 0, endedAt: new Date().toISOString() }, null, 2),
);
process.exitCode = failed ? 1 : 0;
