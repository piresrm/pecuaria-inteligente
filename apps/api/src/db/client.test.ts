import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { createDatabase } from './client.js';
test('erro de conexão ociosa não derruba processo nem repete operação', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'pecuaria-pool-'));
  const passwordFile = join(directory, 'consulta');
  await writeFile(passwordFile, 'segredo-de-teste');
  let recorded = 0;
  const handle = createDatabase(
    {
      host: '127.0.0.1',
      port: 1,
      database: 'teste',
      user: 'consulta',
      passwordFile,
    },
    () => {
      recorded++;
    },
  );
  try {
    expect(() => handle.pool.emit('error', new Error('conexão interrompida'))).not.toThrow();
    expect(handle.pool.totalCount).toBe(0);
    expect(recorded).toBe(1);
  } finally {
    await handle.close();
    await rm(directory, { recursive: true, force: true });
  }
});
