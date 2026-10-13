import { createHash } from 'node:crypto';
import { canonicalJson } from '@pecuaria/contracts/server';
export interface HttpResource<T> {
  dados: T;
  body: string;
  etag: string;
}
export function serializeResource<T>(operation: 'resumo' | 'historico', dados: T): HttpResource<T> {
  const body = canonicalJson(dados);
  return {
    dados,
    body,
    etag: `W/"v1-${operation}-${createHash('sha256').update(body, 'utf8').digest('hex')}"`,
  };
}
/** RFC 9110 entity-tag list; a comma inside an opaque tag is not a delimiter. */
export function matchesIfNoneMatch(header: string | undefined, current: string): boolean {
  if (header === undefined) return false;
  const value = header.replace(/^[ \t]+|[ \t]+$/g, '');
  if (value === '*') return true;
  let index = 0;
  let match = false;
  let tags = 0;
  const opaque = current.startsWith('W/') ? current.slice(2) : current;
  while (index < value.length) {
    while (value[index] === ' ' || value[index] === '\t' || value[index] === ',') index++;
    if (index === value.length) break;
    if (value.slice(index, index + 2) === 'W/') index += 2;
    if (value[index] !== '"') return false;
    const start = index++;
    while (index < value.length && value[index] !== '"') {
      const code = value.charCodeAt(index++);
      if (!(code === 0x21 || (code >= 0x23 && code <= 0x7e) || (code >= 0x80 && code <= 0xff)))
        return false;
    }
    if (value[index] !== '"') return false;
    index++;
    tags++;
    if (value.slice(start, index) === opaque) match = true;
    while (value[index] === ' ' || value[index] === '\t') index++;
    if (index < value.length && value[index] !== ',') return false;
  }
  return tags > 0 && match;
}
