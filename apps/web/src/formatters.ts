/** Instante já validado pelo contrato; datas civis usam formatarDataCivil separadamente. */
export function formatarInstanteBrasilia(instante: string): string {
  return `${new Date(instante).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })} (horário de Brasília)`;
}
