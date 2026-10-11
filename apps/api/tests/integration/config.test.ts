import { expect, test } from 'vitest';
import { databaseConfigFromEnvironment } from '../../src/config.js';
const valid = {
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_NAME: 'pecuaria',
  DB_USER: 'mercado_migracao',
  DB_PASSWORD_FILE: '/run/secrets/migracao',
};
test('configuração exige caminho do segredo e não aceita senha em variável alternativa', () => {
  const environment = { ...valid, DB_PASSWORD_FILE: '', DB_PASSWORD: 'never-used' };
  expect(() => databaseConfigFromEnvironment(environment)).toThrow('DB_PASSWORD_FILE');
});
test.each(['', '0', '65536', '1.5', '5432abc'])('rejeita porta inválida %s', (port) => {
  expect(() => databaseConfigFromEnvironment({ ...valid, DB_PORT: port })).toThrow('DB_PORT');
});
test('configuração mantém identidade e caminho explícitos', () => {
  expect(databaseConfigFromEnvironment(valid)).toEqual({
    host: '127.0.0.1',
    port: 5432,
    database: 'pecuaria',
    user: 'mercado_migracao',
    passwordFile: '/run/secrets/migracao',
  });
});
