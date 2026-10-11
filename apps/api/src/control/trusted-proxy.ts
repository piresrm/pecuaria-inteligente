import { isIP } from 'node:net';
import { ControleErro } from './types.js';
/** Canonical socket identities, including mapped IPv4, share one quota key.
 * Scoped IPv6 and ports are intentionally outside the forwarded-IP contract. */
export function normalizeIp(value: string): string {
  if (value.includes('%') || !isIP(value)) throw new ControleErro('CONTROLE_INDISPONIVEL', 5);
  if (isIP(value) === 4) return value;
  const normalized = new URL(`http://[${value}]`).hostname.slice(1, -1);
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(normalized);
  if (!mapped) return normalized;
  const high = Number.parseInt(mapped[1]!, 16);
  const low = Number.parseInt(mapped[2]!, 16);
  return `${high >>> 8}.${high & 255}.${low >>> 8}.${low & 255}`;
}
/** Only the configured socket peer may supply exactly one forwarded address.
 * Missing or chained trusted headers fail closed rather than guessing a peer. */
export function resolveClientIp(
  remote: string,
  forwarded: string | undefined,
  trusted: readonly string[],
): string {
  const peer = normalizeIp(remote);
  if (!trusted.some((address) => normalizeIp(address) === peer)) return peer;
  if (!forwarded || forwarded.includes(',')) throw new ControleErro('CONTROLE_INDISPONIVEL', 5);
  return normalizeIp(forwarded.trim());
}
