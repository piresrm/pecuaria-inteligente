import type { Static } from 'typebox';
import type * as Schemas from './schemas.js';

export type Perfil = Static<typeof Schemas.Perfil>;
export type Regiao = Static<typeof Schemas.Regiao>;
export type PrecoRegional = Static<typeof Schemas.PrecoRegional>;
export type Resumo = Static<typeof Schemas.Resumo>;
export type Historico = Static<typeof Schemas.Historico>;
export type ConsultaSalva = Static<typeof Schemas.ConsultaSalva>;
export type ResumoSalvo = Static<typeof Schemas.ResumoSalvo>;
export type HistoricoSalvo = Static<typeof Schemas.HistoricoSalvo>;
export type Erro = Static<typeof Schemas.Erro>;
export type ConsultaResumo = Static<typeof Schemas.ConsultaResumo>;
export type ConsultaHistorico = Static<typeof Schemas.ConsultaHistorico>;
export type Janela = Static<typeof Schemas.Janela>;
export type ReferenciaSemanal = Static<typeof Schemas.ReferenciaSemanal>;
export type Filtros = Static<typeof Schemas.FiltrosSalvos>;
