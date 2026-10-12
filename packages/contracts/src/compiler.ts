import { Ajv, type Options } from 'ajv';
import formats from 'ajv-formats';

export function createAjv(code?: Options['code'], inlineRefs: Options['inlineRefs'] = true): Ajv {
  const ajv = new Ajv({
    strict: true,
    inlineRefs,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
    allErrors: false,
    ...(code ? { code } : {}),
  });
  formats.default(ajv, { mode: 'full' });
  return ajv;
}
