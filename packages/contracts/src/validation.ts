import * as generated from './generated/validators.js';
import type { ContractName } from './schemas.js';

export type Validator = (value: unknown) => boolean;
export const validators = generated as unknown as Record<ContractName, Validator>;
