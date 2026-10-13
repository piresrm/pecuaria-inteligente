/** JSON compacto do contrato: UTF-8, chaves ordenadas e inteiros seguros em decimal. */
export function canonicalJson(value: unknown): string {
  const ancestors = new Set<object>();
  function encode(item: unknown): string {
    if (item === null) return 'null';
    if (typeof item === 'string' || typeof item === 'boolean') return JSON.stringify(item);
    if (typeof item === 'number' && Number.isSafeInteger(item)) return String(item);
    if (typeof item !== 'object') throw new TypeError('Valor incompatível com JSON contratual');
    if (ancestors.has(item)) throw new TypeError('JSON não admite ciclos');
    ancestors.add(item);
    try {
      if (Array.isArray(item))
        return `[${Array.from(item, (element: unknown) => encode(element)).join(',')}]`;
      const prototype: unknown = Object.getPrototypeOf(item);
      if (prototype !== Object.prototype && prototype !== null)
        throw new TypeError('Objeto JSON inválido');
      const record = item as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${encode(record[key])}`)
        .join(',')}}`;
    } finally {
      ancestors.delete(item);
    }
  }
  return encode(value);
}
