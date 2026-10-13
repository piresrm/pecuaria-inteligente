import { expect, test } from 'vitest';
import { resolveClientIp } from './trusted-proxy.js';
test.each([
  ['::ffff:192.0.2.1', '203.0.113.9', [], '192.0.2.1'],
  ['::ffff:c000:201', undefined, [], '192.0.2.1'],
  ['2001:0DB8:0000:0000:0000:0000:0000:0001', undefined, [], '2001:db8::1'],
  ['172.20.0.2', '::ffff:192.0.2.1', ['172.20.0.2'], '192.0.2.1'],
  ['::ffff:172.20.0.2', '2001:0db8::1', ['172.20.0.2'], '2001:db8::1'],
] as const)(
  'normaliza identidade e confiança do socket %s',
  (remote, header, trusted, expected) => {
    expect(resolveClientIp(remote, header, trusted)).toBe(expected);
  },
);
test.each([undefined, '', 'unknown', '192.0.2.1, 203.0.113.2', '192.0.2.1:80', 'fe80::1%eth0'])(
  'recusa encaminhamento confiável inválido %s',
  (header) => {
    expect(() => resolveClientIp('172.20.0.2', header, ['172.20.0.2'])).toThrow(
      'CONTROLE_INDISPONIVEL',
    );
  },
);
test('ignora cabeçalho hostil de conexão direta e recusa socket inválido', () => {
  expect(resolveClientIp('192.0.2.1', 'unknown, spoof', ['172.20.0.2'])).toBe('192.0.2.1');
  expect(() => resolveClientIp('', '192.0.2.1', [])).toThrow('CONTROLE_INDISPONIVEL');
});
