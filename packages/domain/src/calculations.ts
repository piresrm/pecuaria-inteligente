import { Decimal } from './decimal.js';
export function positivo(valor: string): InstanceType<typeof Decimal> {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(valor)) throw new RangeError('Decimal positivo inválido');
  const decimal = new Decimal(valor);
  if (decimal.lte('0')) throw new RangeError('Decimal deve ser positivo');
  return decimal;
}
export function precoPorKg(preco: string, peso: string): string {
  return positivo(preco).div(positivo(peso)).toFixed();
}
export function media(precos: string[]): string | null {
  if (precos.length === 0) return null;
  return precos
    .reduce((soma, preco) => soma.plus(positivo(preco)), new Decimal('0'))
    .div(String(precos.length))
    .toFixed();
}
