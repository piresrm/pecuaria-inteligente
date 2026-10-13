import type { ValidateFunction } from 'ajv';
import { createAjv } from './compiler.js';
import { contractSchema, definitions, type ContractName } from './schemas.js';

const ajv = createAjv();
ajv.addSchema(contractSchema);
export const validators = Object.fromEntries(
  Object.keys(definitions).map((name) => {
    const validate = ajv.getSchema(`${contractSchema.$id}#/definitions/${name}`);
    if (!validate) throw new Error(`Contrato sem validador: ${name}`);
    return [name, validate];
  }),
) as Record<ContractName, ValidateFunction>;

export { assertResumo, assertHistorico } from './semantic.js';
export { canonicalJson } from './canonical.js';
export { contractSchema, definitions } from './schemas.js';
