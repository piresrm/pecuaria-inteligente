import { EventEmitter } from 'node:events';
import { createServer } from 'node:net';
import { expect, test } from 'vitest';
import { iniciarServidor } from './server.js';
import { permissiveDependencies, MemoryRepository, resumoUrl } from '../tests/helpers/http.js';
test('sinais fecham HTTP e recurso exatamente uma vez; removem listeners', async () => {
  const signals = new EventEmitter();
  let closed = 0;
  let markClosed!: () => void;
  const resourceClosed = new Promise<void>((resolve) => {
    markClosed = resolve;
  });
  const app = await iniciarServidor(
    permissiveDependencies(new MemoryRepository()),
    { host: '127.0.0.1', port: 0 },
    {
      signals,
      closeDatabase: () => {
        closed++;
        markClosed();
        return Promise.resolve();
      },
    },
  );
  const url = `${app.listeningOrigin}${resumoUrl}`;
  try {
    expect((await fetch(url)).status).toBe(200);
    signals.emit('SIGTERM');
    signals.emit('SIGINT');
    await resourceClosed;
    expect(closed).toBe(1);
    expect(signals.listenerCount('SIGTERM')).toBe(0);
    expect(signals.listenerCount('SIGINT')).toBe(0);
    await expect(fetch(url)).rejects.toThrow();
  } finally {
    await app.close();
  }
});
test('falha de listen fecha banco e não deixa listeners de sinais', async () => {
  const portOwner = createServer();
  await new Promise<void>((resolve) => portOwner.listen(0, '127.0.0.1', resolve));
  const address = portOwner.address();
  if (!address || typeof address === 'string') throw new Error('porta ausente');
  const signals = new EventEmitter();
  let closed = 0;
  try {
    await expect(
      iniciarServidor(
        permissiveDependencies(new MemoryRepository()),
        { host: '127.0.0.1', port: address.port },
        {
          signals,
          closeDatabase: () => {
            closed++;
            return Promise.resolve();
          },
        },
      ),
    ).rejects.toThrow();
    expect(closed).toBe(1);
    expect(signals.listenerCount('SIGTERM')).toBe(0);
  } finally {
    await new Promise<void>((resolve, reject) =>
      portOwner.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
