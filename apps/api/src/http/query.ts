import { HttpError } from './errors.js';
/** Preserve raw occurrences. The framework parser must not decode before this. */
export function parseQuery(raw: string): Record<string, string> {
  if (Buffer.byteLength(raw, 'utf8') > 1024) throw new HttpError('PARAMETROS_INVALIDOS');
  const values: Record<string, string> = Object.create(null) as Record<string, string>;
  if (raw === '') return values;
  for (const pair of raw.split('&')) {
    const separator = pair.indexOf('=');
    if (separator < 0) throw new HttpError('PARAMETROS_INVALIDOS');
    let name: string;
    let value: string;
    try {
      name = decodeURIComponent(pair.slice(0, separator).replaceAll('+', ' '));
      value = decodeURIComponent(pair.slice(separator + 1).replaceAll('+', ' '));
      // Raw non-percent UTF-16 surrogate input must also be well-formed Unicode.
      encodeURIComponent(name);
      encodeURIComponent(value);
    } catch {
      throw new HttpError('PARAMETROS_INVALIDOS');
    }
    if (Object.hasOwn(values, name)) throw new HttpError('PARAMETROS_INVALIDOS');
    values[name] = value;
  }
  return values;
}
export function queryFromUrl(url: string): Record<string, string> {
  const index = url.indexOf('?');
  return parseQuery(index === -1 ? '' : url.slice(index + 1));
}
