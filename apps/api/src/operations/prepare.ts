import { fileURLToPath, pathToFileURL } from 'node:url';
import { databaseConfigFromEnvironment, type DatabaseConfig } from '../config.js';
import { createDatabase } from '../db/client.js';
import { abrirConexaoInicial } from '../db/startup.js';
import { publicarBase, type Publicacao } from '../db/publication.js';
import { validarBase } from '../demo/validate.js';

export const diretorioDemonstrativo = fileURLToPath(
  new URL('../../../../data/demonstrativa/v0.1/', import.meta.url),
);
export async function executarPublicacao(
  config: DatabaseConfig,
  diretorio: string,
  modo: 'inicial' | 'explicito',
): Promise<Publicacao> {
  const base = await validarBase(diretorio);
  const database = createDatabase(config);
  try {
    await abrirConexaoInicial(database.pool);
    return await publicarBase(database, base, modo);
  } finally {
    await database.close();
  }
}
export async function prepararBase(
  config: DatabaseConfig,
  diretorio = diretorioDemonstrativo,
): Promise<Publicacao> {
  return executarPublicacao(config, diretorio, 'inicial');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.info(
    JSON.stringify(
      await prepararBase(
        databaseConfigFromEnvironment(process.env),
        process.argv[2] ?? diretorioDemonstrativo,
      ),
    ),
  );
