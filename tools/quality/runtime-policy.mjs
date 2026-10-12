import { accessSync, constants, statSync } from 'node:fs';
export function runtimeIdentity(uid = process.getuid(), gid = process.getgid()) {
  if (!Number.isInteger(uid) || uid <= 0 || !Number.isInteger(gid) || gid <= 0)
    throw new Error('Execução local exige UID sem privilégios');
  return { RUNTIME_UID: String(uid), RUNTIME_GID: String(gid) };
}
export function assertRuntimePolicy(effective, { inspectSecretFiles = false } = {}) {
  for (const [name, service] of Object.entries(effective.services)) {
    if (service.privileged || service.volumes?.some((v) => v.source?.includes('docker.sock')))
      throw new Error(`Configuração insegura: ${name}`);
    if (['api', 'postgres'].includes(name) && service.ports?.length)
      throw new Error(`Porta direta pública: ${name}`);
    if (
      ['api', 'postgres'].includes(name) &&
      effective.networks &&
      Object.keys(service.networks ?? {}).some((network) => !effective.networks[network]?.internal)
    )
      throw new Error(`Serviço exige exclusivamente rede interna: ${name}`);
    if (
      ['postgres', 'api', 'migrar', 'preparar', 'publicar'].includes(name) &&
      !/^[1-9][0-9]*:[1-9][0-9]*$/.test(service.user)
    )
      throw new Error(`Runtime exige usuário sem privilégios: ${name}`);
  }
  for (const name of ['api', 'migrar', 'preparar', 'publicar']) {
    if (
      effective.services[name] &&
      effective.services[name].user !== effective.services.postgres.user
    )
      throw new Error(`Serviços exigem a mesma identidade dos segredos: ${name}`);
  }
  if (inspectSecretFiles) {
    const [uid, gid] = effective.services.postgres.user.split(':').map(Number);
    for (const name of ['admin', 'migracao', 'publicador', 'consulta']) {
      const file = effective.secrets?.[name]?.file;
      if (!file) throw new Error(`Arquivo de segredo obrigatório: ${name}`);
      const metadata = statSync(file);
      if (!metadata.isFile() || (metadata.mode & 0o777) !== 0o600)
        throw new Error(`Segredo exige arquivo regular0600: ${name}`);
      if (metadata.uid !== uid || metadata.gid !== gid)
        throw new Error(`Identidade deve corresponder ao proprietário do segredo: ${name}`);
      accessSync(file, constants.R_OK);
    }
  }
  const entry = effective.services.entrada;
  if (entry.ports?.some((p) => p.host_ip !== '127.0.0.1'))
    throw new Error('Entrada exige loopback');
  if (effective.services.api.environment.API_TRUSTED_PROXIES !== entry.networks.local.ipv4_address)
    throw new Error('IP de proxy deve ser exclusivamente o da entrada');
}
