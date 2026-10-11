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
