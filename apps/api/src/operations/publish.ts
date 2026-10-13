import { pathToFileURL } from 'node:url';
import { databaseConfigFromEnvironment, type DatabaseConfig } from '../config.js';
import type { Publicacao } from '../db/publication.js';
import { diretorioDemonstrativo, executarPublicacao } from './prepare.js';

export async function publicarDiretorio(
  config: DatabaseConfig,
  diretorio = diretorioDemonstrativo,
): Promise<Publicacao> {
  return executarPublicacao(config, diretorio, 'explicito');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.info(
    JSON.stringify(
      await publicarDiretorio(
        databaseConfigFromEnvironment(process.env),
        process.argv[2] ?? diretorioDemonstrativo,
      ),
    ),
  );
