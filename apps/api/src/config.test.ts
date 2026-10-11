import { expect, test } from 'vitest';
import { serverConfigFromEnvironment } from './config.js';
const environment = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'pecuaria',
  DB_USER: 'mercado_consulta',
  DB_PASSWORD_FILE: '/run/consulta',
  API_PORT: '3000',
  API_HOST: '127.0.0.1',
  API_PROXY_MODE: 'direct',
};
test('configuração explícita direta fornece limites aprovados e segredo_FILE', () => {
  expect(serverConfigFromEnvironment(environment)).toMatchObject({
    proxyMode: 'direct',
    trustedProxies: [],
    quotaCapacity: 30,
    quotaRefillPerSecond: 2,
    databaseConcurrency: 20,
    port: 3000,
    host: '127.0.0.1',
    database: { passwordFile: '/run/consulta' },
  });
});
test('produção exige proxy confiável e endereços canonicalizados; modo não é inferido', () => {
  expect(() => serverConfigFromEnvironment({ ...environment, NODE_ENV: 'production' })).toThrow(
    /proxy/i,
  );
  expect(() => serverConfigFromEnvironment({ ...environment, API_PROXY_MODE: '' })).toThrow(
    /API_PROXY_MODE/,
  );
  expect(() => serverConfigFromEnvironment({ ...environment, API_PROXY_MODE: 'trusted' })).toThrow(
    /API_TRUSTED_PROXIES/,
  );
  expect(
    serverConfigFromEnvironment({
      ...environment,
      NODE_ENV: 'production',
      API_PROXY_MODE: 'trusted',
      API_TRUSTED_PROXIES: '::ffff:172.20.0.2,2001:0db8::1',
    }).trustedProxies,
  ).toEqual(['172.20.0.2', '2001:db8::1']);
});
test.each([
  { API_PORT: '0' },
  { API_PORT: '3000x' },
  { API_HOST: '' },
  { API_PROXY_MODE: 'auto' },
  { API_PROXY_MODE: 'trusted', API_TRUSTED_PROXIES: '0.0.0.0/0' },
  { API_PROXY_MODE: 'trusted', API_TRUSTED_PROXIES: '172.20.0.2,' },
  { API_DATABASE_CONCURRENCY: '21' },
  { API_QUOTA_CAPACITY: '0' },
  { API_QUOTA_REFILL_PER_SECOND: 'NaN' },
])('recusa configuração inválida %j', (invalid) => {
  expect(() => serverConfigFromEnvironment({ ...environment, ...invalid })).toThrow();
});
