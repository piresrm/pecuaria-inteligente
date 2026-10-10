import { expect, test } from 'vitest';
import { canonicalJson } from './canonical.js';

test('canonicalJson preserva UTF-8 e ordena chaves', () => {
  expect(canonicalJson({ b: 1, a: 'à' })).toBe('{"a":"à","b":1}');
});

test('ordena objetos aninhados e preserva listas', () => {
  expect(canonicalJson({ z: [{ b: 2, a: 1 }, 3], a: 'Goiás' })).toBe(
    '{"a":"Goiás","z":[{"a":1,"b":2},3]}',
  );
});

test('inteiros usam notação decimal', () => {
  expect(canonicalJson({ n: 9007199254740991, b: -1, a: 0 })).toBe(
    '{"a":0,"b":-1,"n":9007199254740991}',
  );
});

test.each([undefined, NaN, Infinity, 1.2, new Date(), { a: undefined }])(
  'rejeita entrada fora de JSON contratual: %s',
  (value) => {
    expect(() => canonicalJson(value)).toThrow();
  },
);

test('ordena lexicograficamente chaves que parecem índices', () => {
  expect(canonicalJson({ '2': 'dois', '10': 'dez' })).toBe('{"10":"dez","2":"dois"}');
});

test('escapa controles, aspas e barra invertida sem escapar UTF-8 ou barra comum', () => {
  expect(canonicalJson({ texto: 'a\n"\\/à' })).toBe(String.raw`{"texto":"a\n\"\\/à"}`);
});
