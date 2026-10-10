import { expect, it } from 'vitest';
import Big from 'big.js';
import { media, precoPorKg } from './calculations.js';
import {
  decimalApresentado,
  formatarDataCivil,
  formatarPercentual,
  formatarPreco,
} from './presentation.js';
import { adicionarDias, semanasNoIntervalo } from './calendar.js';
it('CA03 divide 3000 por 200 sem arredondar antes da apresentação', () => {
  expect(precoPorKg('3000.00', '200.00')).toBe('15');
  expect(decimalApresentado(precoPorKg('3000.00', '200.00'), 2)).toBe('15.00');
  expect(formatarPreco('3000')).toBe('R$\u00a03.000,00');
});
it('mantém média exata, 40 casas na divisão periódica e ausência nula', () => {
  expect(media(['1.00', '1.00', '2.00'])).toBe('1.3333333333333333333333333333333333333333');
  expect(media([])).toBeNull();
  expect(precoPorKg('1.005', '1')).toBe('1.005');
});
it('isola construtor decimal de configuração global de consumidores', () => {
  const dp = Big.DP;
  const rm = Big.RM;
  const strict = Big.strict;
  try {
    Big.DP = 1;
    Big.RM = Big.roundDown;
    Big.strict = false;
    expect(precoPorKg('1', '3')).toBe('0.3333333333333333333333333333333333333333');
    expect(Big.DP).toBe(1);
    expect(Big.RM).toBe(Big.roundDown);
    expect(Big.strict).toBe(false);
  } finally {
    Big.DP = dp;
    Big.RM = rm;
    Big.strict = strict;
  }
});
it.each([
  ['1.005', '1.01'],
  ['-1.005', '-1.01'],
  ['0.004', '0.00'],
  ['-0.004', '0.00'],
])('arredonda %s somente apresentação com empate longe de zero', (valor, esperado) => {
  expect(decimalApresentado(valor, 2)).toBe(esperado);
});
it('apresenta sinais, percentuais e ausência em português brasileiro', () => {
  expect(formatarPercentual('-4.65')).toBe('-4,7%');
  expect(formatarPercentual('5')).toBe('5,0%');
  expect(formatarPreco(null)).toBe('Sem dados');
  expect(decimalApresentado(null, 2)).toBeNull();
  expect(formatarDataCivil('2024-02-29')).toBe('29/02/2024');
});
it.each([
  ['0', '200'],
  ['3000', '0'],
  ['-1', '200'],
  ['NaN', '200'],
])('rejeita preço/peso não positivos %s/%s', (preco, peso) => {
  expect(() => precoPorKg(preco, peso)).toThrow(RangeError);
});
it('calendário civil atravessa bissextos e século sem fuso', () => {
  expect(adicionarDias('2024-02-28', 1)).toBe('2024-02-29');
  expect(adicionarDias('2024-03-01', -1)).toBe('2024-02-29');
  expect(adicionarDias('1900-02-28', 1)).toBe('1900-03-01');
  expect(adicionarDias('2000-02-28', 1)).toBe('2000-02-29');
  expect(semanasNoIntervalo('2024-02-27', '2024-03-11')).toEqual(['2024-03-04', '2024-03-11']);
  expect(semanasNoIntervalo('2024-03-05', '2024-03-10')).toEqual([]);
  expect(adicionarDias('0001-01-01', 7)).toBe('0001-01-08');
});
it.each(['2023-02-29', '0000-01-01', '2024-04-31', '2024-02-30', '2024-02-29T00:00:00Z'])(
  'rejeita data civil inválida %s',
  (data) => {
    expect(() => adicionarDias(data, 1)).toThrow(RangeError);
  },
);
it('rejeita calendário invertido e ultrapassar anos suportados', () => {
  expect(() => semanasNoIntervalo('2024-03-11', '2024-03-04')).toThrow(RangeError);
  expect(() => adicionarDias('0001-01-01', -1)).toThrow(RangeError);
  expect(() => adicionarDias('9999-12-31', 1)).toThrow(RangeError);
});
it('não arredonda média antes de converter e preserva inteiros grandes na apresentação', () => {
  expect(precoPorKg(media(['1.004', '1.006'])!, '2')).toBe('0.5025');
  expect(decimalApresentado(precoPorKg(media(['1.004', '1.006'])!, '2'), 2)).toBe('0.50');
  expect(formatarPreco('9007199254740993.005')).toBe('R$\u00a09.007.199.254.740.993,01');
});
it('apresentação de divisões periódicas é estável com 40 e 80 casas', () => {
  const preciso = Big();
  preciso.strict = true;
  preciso.DP = 80;
  preciso.RM = Big.roundHalfUp;
  expect(decimalApresentado(precoPorKg('3000.01', '205'), 2)).toBe('14.63');
  expect(decimalApresentado(new preciso('3000.01').div('205').toFixed(), 2)).toBe('14.63');
});
