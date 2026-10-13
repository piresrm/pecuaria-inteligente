import { adicionarDias } from './calendar.js';
import { Decimal } from './decimal.js';
export function decimalApresentado(valor: string | null, casas: 1 | 2): string | null {
  if (valor === null) return null;
  const arredondado = new Decimal(valor).round(casas, Decimal.roundHalfUp);
  return arredondado.eq('0') ? new Decimal('0').toFixed(casas) : arredondado.toFixed(casas);
}
function localizado(valor: string): string {
  const [inteiro, fracao] = valor.split('.');
  return `${(inteiro ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fracao ?? ''}`;
}
export function formatarPreco(valor: string | null): string {
  const apresentado = decimalApresentado(valor, 2);
  return apresentado === null ? 'Sem dados' : `R$\u00a0${localizado(apresentado)}`;
}
export function formatarPercentual(valor: string | null): string {
  const apresentado = decimalApresentado(valor, 1);
  return apresentado === null ? 'Dados insuficientes' : `${localizado(apresentado)}%`;
}
export function formatarDataCivil(data: string): string {
  adicionarDias(data, 0);
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}
