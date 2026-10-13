import type { Perfil } from '@pecuaria/contracts/types';
export interface Filtragem {
  perfis: Perfil[];
  inicio: string;
  fim: string;
  regiaoId: string | null;
}
export interface Cobertura {
  disponiveis: number;
  total: number;
  regioesPresentes: string[];
}
export interface PontoHistorico {
  semana: string;
  media: string | null;
  precoPorKg: string | null;
  cobertura: Cobertura;
}
export interface Variacao {
  absoluta: string;
  percentual: string;
  inicio: string;
  fim: string;
  coberturaAnterior: Cobertura;
  coberturaAtual: Cobertura;
  composicaoAlterada: boolean;
}
export interface Indicadores {
  perfilId: string | null;
  regiaoId: string | null;
  semana: string | null;
  media: string | null;
  precoPorKg: string | null;
  cobertura: Cobertura;
  variacaoSemanal: Variacao | null;
  variacaoPeriodo: Variacao | null;
}
export interface LinhaPreco {
  perfilId: string;
  regiaoId: string | null;
  semana: string | null;
  preco: string | null;
  precoPorKg: string | null;
  cobertura: Cobertura;
}
export interface ConsultaCalculada {
  linhas: LinhaPreco[];
  indicadores: Indicadores;
  serie: PontoHistorico[];
}
