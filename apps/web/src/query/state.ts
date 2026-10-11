import type { Filtros, Historico, Resumo } from '@pecuaria/contracts/types';
import type { ConsultaCalculada } from '@pecuaria/domain';
export interface Recurso<T> {
  dados: T;
  etag: string;
  recebidoEm: string;
  verificadoEm: string;
}
export type Prioridade = 'consulta' | 'fundo';
export interface Solicitacao {
  filtros: Filtros;
  perfilAtivoId: string | null;
}
export interface Fotografia extends Solicitacao {
  resumo: Recurso<Resumo>;
  historicos: Record<string, Recurso<Historico>>;
  resultado: ConsultaCalculada;
  etapa: 'resumo' | 'completa';
}
export interface QueryState {
  solicitado: Solicitacao | null;
  exibido: Fotografia | null;
  geracao: number;
  etapa: 'resumo' | 'completa' | null;
  pendente: boolean;
  verificando: boolean;
  erros: Record<string, string>;
  ultimaVerificacao: number | null;
  desatualizado: boolean;
}
export interface MercadoGateway {
  resumo(local?: Recurso<Resumo>, prioridade?: Prioridade): Promise<Recurso<Resumo>>;
  historico(
    perfilId: string,
    versao: string,
    local?: Recurso<Historico>,
    prioridade?: Prioridade,
  ): Promise<Recurso<Historico>>;
  prioritize?(): void;
  dispose?(): void;
}
