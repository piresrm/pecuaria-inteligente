import { Ajv, type Options } from 'ajv';
import formats from 'ajv-formats';

export function createAjv(code?: Options['code']): Ajv {
  const ajv = new Ajv({
    strict: true,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
    allErrors: false,
    ...(code ? { code } : {}),
  });
  formats.default(ajv, { mode: 'full' });
  return ajv;
}
