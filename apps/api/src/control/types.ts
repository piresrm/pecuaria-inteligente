import type { BancoOperacao } from './metrics.js';
export type ControleCodigo = 'LIMITE_REQUISICOES' | 'SERVICO_OCUPADO' | 'CONTROLE_INDISPONIVEL';
export class ControleErro extends Error {
  constructor(
    readonly codigo: ControleCodigo,
    readonly retryAfter: number,
  ) {
    super(codigo);
  }
}
export interface EntradaControl {
  verificar(origem: {
    remoteAddress: string;
    forwardedFor: string | undefined;
  }): void | Promise<void>;
}
export interface BancoControl {
  run<T>(operation: () => Promise<T>, name?: BancoOperacao): Promise<T>;
}
