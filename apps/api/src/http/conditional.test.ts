import { expect, test } from 'vitest';
import { matchesIfNoneMatch } from './conditional.js';
test.each(['\u00a0W/"opaque"', 'W/"opaque"\u00a0', '\nW/"opaque"', 'W/"opaque"\r'])(
  'não aceita espaço fora de OWS HTTP: %j',
  (header) => {
    expect(matchesIfNoneMatch(header, 'W/"opaque"')).toBe(false);
  },
);
test('compara qualquer entidade opaca por regra fraca e preserva vírgula interna', () => {
  expect(matchesIfNoneMatch(' "outro", W/"opaque,é" ', '"opaque,é"')).toBe(true);
  expect(matchesIfNoneMatch(',,,"opaque",,,', 'W/"opaque"')).toBe(true);
  expect(matchesIfNoneMatch('w/"opaque"', 'W/"opaque"')).toBe(false);
  expect(matchesIfNoneMatch('*, "opaque"', 'W/"opaque"')).toBe(false);
});
