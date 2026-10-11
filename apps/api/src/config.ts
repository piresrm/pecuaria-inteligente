import { normalizeIp } from './control/trusted-proxy.js';
/** Connection identity and explicit mounted secret; passwords never enter configuration logs. */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  passwordFile: string;
}

export function databaseConfigFromEnvironment(environment: NodeJS.ProcessEnv): DatabaseConfig {
  const required = (name: string): string => {
    const value = environment[name];
    if (!value?.trim()) throw new Error(`Configuração obrigatória ausente: ${name}`);
    return value;
  };
  const portText = required('DB_PORT');
  const port = Number(portText);
  if (!/^[0-9]+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT deve ser um inteiro entre 1 e 65535.');
  }
  return {
    host: required('DB_HOST'),
    port,
    database: required('DB_NAME'),
    user: required('DB_USER'),
    passwordFile: required('DB_PASSWORD_FILE'),
  };
}

export interface ServerConfig {
  database: DatabaseConfig;
  host: string;
  port: number;
  proxyMode: 'direct' | 'trusted';
  trustedProxies: readonly string[];
  quotaCapacity: number;
  quotaRefillPerSecond: number;
  databaseConcurrency: number;
}
export function serverConfigFromEnvironment(environment: NodeJS.ProcessEnv): ServerConfig {
  const required = (name: string): string => {
    const value = environment[name]?.trim();
    if (!value) throw new Error(`Configuração obrigatória ausente: ${name}`);
    return value;
  };
  const numeric = (name: string, fallback: number, max: number, integer = true): number => {
    const text = environment[name];
    const value = text === undefined ? fallback : Number(text);
    if (
      (text !== undefined && !/^[0-9]+(?:\.[0-9]+)?$/.test(text)) ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > max ||
      (integer && !Number.isInteger(value))
    )
      throw new Error(`${name} inválido`);
    return value;
  };
  const proxyMode = required('API_PROXY_MODE');
  if (proxyMode !== 'direct' && proxyMode !== 'trusted') throw new Error('API_PROXY_MODE inválido');
  if (environment.NODE_ENV === 'production' && proxyMode !== 'trusted')
    throw new Error('Produção exige proxy confiável');
  const trustedProxies =
    proxyMode === 'trusted'
      ? required('API_TRUSTED_PROXIES')
          .split(',')
          .map((value) => normalizeIp(value.trim()))
      : [];
  return {
    database: databaseConfigFromEnvironment(environment),
    host: required('API_HOST'),
    port: numeric('API_PORT', Number(required('API_PORT')), 65535),
    proxyMode,
    trustedProxies,
    quotaCapacity: numeric('API_QUOTA_CAPACITY', 30, 30),
    quotaRefillPerSecond: numeric('API_QUOTA_REFILL_PER_SECOND', 2, 2, false),
    databaseConcurrency: numeric('API_DATABASE_CONCURRENCY', 20, 20),
  };
}
