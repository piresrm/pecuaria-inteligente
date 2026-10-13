import { ControleErro, type EntradaControl } from './types.js';
import { IpQuota } from './ip-quota.js';
import { ControlMetrics } from './metrics.js';
import { normalizeIp, resolveClientIp } from './trusted-proxy.js';
export class EntryControl implements EntradaControl {
  private readonly trusted: readonly string[];
  constructor(
    private readonly quota: IpQuota,
    trusted: readonly string[],
    private readonly metrics = new ControlMetrics(),
  ) {
    this.trusted = Object.freeze(trusted.map(normalizeIp));
  }
  verificar(origem: { remoteAddress: string; forwardedFor: string | undefined }): void {
    try {
      const ip = resolveClientIp(origem.remoteAddress, origem.forwardedFor, this.trusted);
      const result = this.quota.consume(ip);
      if (!result.permitido) throw new ControleErro('LIMITE_REQUISICOES', result.retryAfter);
      this.metrics.entry('admitidas');
    } catch (error) {
      this.metrics.entry(
        error instanceof ControleErro && error.codigo === 'LIMITE_REQUISICOES'
          ? 'recusadas'
          : 'indisponiveis',
      );
      throw error instanceof ControleErro ? error : new ControleErro('CONTROLE_INDISPONIVEL', 5);
    }
  }
}
