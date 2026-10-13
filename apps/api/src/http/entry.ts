import type { FastifyRequest } from 'fastify';
import { ControleErro, type EntradaControl } from '../control/types.js';
/** Shared by the ordinary lifecycle and router errors occurring before hooks. */
export async function verifyEntry(request: FastifyRequest, entrada: EntradaControl): Promise<void> {
  if (!request.url.startsWith('/api/')) return;
  try {
    const forwarded = request.headers['x-forwarded-for'];
    await entrada.verificar({
      remoteAddress: request.raw.socket.remoteAddress ?? '',
      forwardedFor: typeof forwarded === 'string' ? forwarded : forwarded?.join(','),
    });
  } catch (error) {
    throw error instanceof ControleErro ? error : new ControleErro('CONTROLE_INDISPONIVEL', 5);
  }
}
