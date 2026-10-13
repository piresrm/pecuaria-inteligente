import { expect, test } from 'vitest';
import { parseQuery } from './query.js';
test('limite bruto é 1.024 bytes UTF-8, antes da decodificação', () => {
  const exact = `x=${'é'.repeat(511)}`;
  expect(Buffer.byteLength(exact, 'utf8')).toBe(1024);
  expect(parseQuery(exact).x).toBe('é'.repeat(511));
  expect(() => parseQuery(`${exact}a`)).toThrow();
  expect(() => parseQuery(`x=${'%61'.repeat(341)}`)).toThrow();
});
test('nomes repetidos codificados e protótipo não se perdem na análise', () => {
  expect(() => parseQuery('perfilId=a&%70erfilId=a')).toThrow();
  const parsed = parseQuery('__proto__=a&constructor=b');
  expect(parsed).toHaveProperty('__proto__', 'a');
  expect(parsed).toHaveProperty('constructor', 'b');
  expect(() => parseQuery('x=%E2%82')).toThrow();
  expect(() => parseQuery('x=\uD800')).toThrow();
});
