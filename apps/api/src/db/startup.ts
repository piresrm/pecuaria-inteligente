import { setTimeout } from 'node:timers/promises';
/** Retry only acquiring an initial connection. Never replay a SQL operation. */
export async function abrirConexaoInicial(
  pool: { connect(): Promise<{ release(): void }> },
  cancelled: () => boolean = () => false,
  pause: (ms: number) => Promise<unknown> = setTimeout,
): Promise<void> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    if (cancelled()) throw new Error('Inicialização cancelada');
    try {
      const client = await pool.connect();
      client.release();
      if (cancelled()) throw new Error('Inicialização cancelada');
      return;
    } catch (error) {
      if (cancelled()) throw new Error('Inicialização cancelada', { cause: error });
      if (attempt === 5) throw error;
      await pause(2000);
    }
  }
}
