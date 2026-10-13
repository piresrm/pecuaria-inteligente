import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtimeIdentity, assertRuntimePolicy } from './runtime-policy.mjs';
test('recusa UID0 sem alterar permissões dos segredos', () => {
  assert.throws(() => runtimeIdentity(0, 0), /privilégios/);
  assert.throws(() => runtimeIdentity(1001, 0), /privilégios/);
  assert.deepEqual(runtimeIdentity(1001, 1001), { RUNTIME_UID: '1001', RUNTIME_GID: '1001' });
});
test('recusa serviços públicos com runtime raiz, portas diretas ou proxy amplo', () => {
  const safe = {
    services: {
      api: { user: '1001:1001', environment: { API_TRUSTED_PROXIES: '172.29.1.2' } },
      postgres: { user: '1001:1001' },
      entrada: {
        ports: [{ host_ip: '127.0.0.1' }],
        networks: { local: { ipv4_address: '172.29.1.2' } },
      },
    },
  };
  assert.doesNotThrow(() => assertRuntimePolicy(safe));
  assert.throws(
    () =>
      assertRuntimePolicy({
        services: { ...safe.services, api: { ...safe.services.api, user: '0:0' } },
      }),
    /privilégios/,
  );
  assert.throws(
    () =>
      assertRuntimePolicy({
        services: { ...safe.services, api: { ...safe.services.api, user: '1001:0' } },
      }),
    /privilégios/,
  );
  assert.throws(
    () =>
      assertRuntimePolicy({
        services: { ...safe.services, postgres: { ports: [{ published: '5432' }] } },
      }),
    /direta/,
  );
  assert.throws(
    () =>
      assertRuntimePolicy({
        services: {
          ...safe.services,
          api: { ...safe.services.api, environment: { API_TRUSTED_PROXIES: '*' } },
        },
      }),
    /proxy/,
  );
});

test('local:up reconcilia os papéis antes de iniciar as dependências', async () => {
  const { localComposeCommands } = await import('./local-compose.mjs');
  assert.deepEqual(localComposeCommands('up'), [
    ['up', '-d', '--wait', '--wait-timeout', '180', 'postgres'],
    ['exec', '-T', 'postgres', '/docker-entrypoint-initdb.d/10-roles.sh'],
    ['up', '-d', '--build', '--wait', '--wait-timeout', '180'],
  ]);
});

test('preparação cria segredos independentes0600 e não sobrescreve os existentes', async () => {
  const { mkdtemp, readFile, rm, stat } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { prepareSecrets } = await import('./local-prepare.mjs');
  const directory = await mkdtemp(join(tmpdir(), 'pecuaria-secrets-'));
  try {
    await prepareSecrets(directory);
    const roles = ['admin', 'migracao', 'publicador', 'consulta'];
    const first = await Promise.all(roles.map((role) => readFile(join(directory, role), 'utf8')));
    assert.equal(new Set(first).size, 4);
    assert.equal((await stat(directory)).mode & 0o777, 0o700);
    for (const role of roles) assert.equal((await stat(join(directory, role))).mode & 0o777, 0o600);
    await prepareSecrets(directory);
    assert.deepEqual(
      await Promise.all(roles.map((role) => readFile(join(directory, role), 'utf8'))),
      first,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('recusa PostgreSQL sem identidade explícita ou diferente dos consumidores de segredos', () => {
  const safe = {
    services: {
      api: { user: '1001:1001', environment: { API_TRUSTED_PROXIES: '172.29.1.2' } },
      postgres: { user: '1001:1001' },
      entrada: {
        ports: [{ host_ip: '127.0.0.1' }],
        networks: { local: { ipv4_address: '172.29.1.2' } },
      },
    },
  };
  assert.doesNotThrow(() => assertRuntimePolicy(safe));
  for (const user of [undefined, '0:0', '1001:0', '999:999']) {
    assert.throws(
      () => assertRuntimePolicy({ services: { ...safe.services, postgres: { user } } }),
      /privilégios|identidade/,
    );
  }
});

test('Compose efetivo usa a identidade do proprietário para PostgreSQL e consumidores', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(
    'docker',
    ['compose', '-f', 'compose.yaml', 'config', '--format', 'json'],
    {
      env: { ...process.env, RUNTIME_UID: '1001', RUNTIME_GID: '1002' },
      encoding: 'utf8',
    },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  for (const name of ['postgres', 'migrar', 'preparar', 'api']) {
    assert.equal(config.services[name].user, '1001:1002', name);
  }
  assert.doesNotThrow(() => assertRuntimePolicy(config));
});

test('preflight recusa segredos de outra identidade ou permissões ampliadas sem alterar arquivos', async () => {
  const { mkdtemp, chmod, rm, stat } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { prepareSecrets } = await import('./local-prepare.mjs');
  const directory = await mkdtemp(join(tmpdir(), 'pecuaria-owner-'));
  const uid = process.getuid();
  const gid = process.getgid();
  const identity = `${uid}:${gid}`;
  const config = {
    services: {
      api: { user: identity, environment: { API_TRUSTED_PROXIES: '172.29.1.2' } },
      postgres: { user: identity },
      entrada: { networks: { local: { ipv4_address: '172.29.1.2' } } },
    },
    secrets: Object.fromEntries(
      ['admin', 'migracao', 'publicador', 'consulta'].map((name) => [
        name,
        { file: join(directory, name) },
      ]),
    ),
  };
  try {
    await prepareSecrets(directory);
    assert.doesNotThrow(() => assertRuntimePolicy(config, { inspectSecretFiles: true }));
    for (const identity of [`${uid + 1}:${gid}`, `${uid}:${gid + 1}`]) {
      assert.throws(
        () =>
          assertRuntimePolicy(
            {
              ...config,
              services: {
                ...config.services,
                api: { ...config.services.api, user: identity },
                postgres: { user: identity },
              },
            },
            { inspectSecretFiles: true },
          ),
        /proprietário/,
      );
    }
    const passwordFile = join(directory, 'consulta');
    await chmod(passwordFile, 0o644);
    assert.throws(() => assertRuntimePolicy(config, { inspectSecretFiles: true }), /0600/);
    assert.equal((await stat(passwordFile)).mode & 0o777, 0o644);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Compose reserva o IP fixo do proxy fora da faixa dinâmica local e E2E', async () => {
  const { spawnSync } = await import('node:child_process');
  for (const { env, subnet, dynamic, proxy } of [
    { env: {}, subnet: '172.30.10.0/24', dynamic: '172.30.10.128/25', proxy: '172.30.10.2' },
    {
      env: {
        LOCAL_SUBNET: '172.29.123.0/24',
        LOCAL_DYNAMIC_RANGE: '172.29.123.128/25',
        CADDY_IP: '172.29.123.2',
      },
      subnet: '172.29.123.0/24',
      dynamic: '172.29.123.128/25',
      proxy: '172.29.123.2',
    },
  ]) {
    const result = spawnSync(
      'docker',
      ['compose', '-f', 'compose.yaml', 'config', '--format', 'json'],
      {
        env: { ...process.env, ...env },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const config = JSON.parse(result.stdout);
    assert.equal(config.networks.local.ipam.config[0].subnet, subnet);
    assert.equal(config.networks.local.ipam.config[0].ip_range, dynamic);
    assert.equal(config.services.entrada.networks.local.ipv4_address, proxy);
  }
});

test('Compose publica somente a entrada na rede de ingresso e mantém banco/API internos', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(
    'docker',
    ['compose', '-f', 'compose.yaml', 'config', '--format', 'json'],
    { env: process.env, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(config.services.entrada.networks).sort(), ['ingresso', 'local']);
  assert.equal(config.networks.local.internal, true);
  assert.equal(config.networks.ingresso.internal ?? false, false);
  for (const name of ['api', 'postgres']) {
    assert.deepEqual(Object.keys(config.services[name].networks), ['local']);
    assert.equal(config.services[name].ports, undefined);
    assert.throws(
      () =>
        assertRuntimePolicy({
          ...config,
          services: {
            ...config.services,
            [name]: { ...config.services[name], networks: { local: {}, ingresso: {} } },
          },
        }),
      /interna/,
    );
  }
});
