import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export async function prepareSecrets(directory = '.local/secrets') {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  for (const role of ['admin', 'migracao', 'publicador', 'consulta']) {
    try {
      await writeFile(resolve(directory, role), randomBytes(32).toString('hex') + '\n', {
        flag: 'wx',
        mode: 0o600,
      });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
}
if (process.argv[1]?.endsWith('/local-prepare.mjs')) {
  await prepareSecrets(process.argv[2]);
  console.info('Segredos locais preparados; arquivos existentes preservados.');
}
