import { webcrypto } from 'node:crypto';
import * as matchers from '@testing-library/jest-dom/matchers';
import type matcherTypes from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';
expect.extend(matchers);
// Adapter for Vitest 5's two-parameter matchers; upstream /vitest targets older Assertion<T>.
declare module 'vitest' {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toBeVisible: matcherTypes.TestingLibraryMatchers<T, R>['toBeVisible'];
    toBeEnabled: matcherTypes.TestingLibraryMatchers<T, R>['toBeEnabled'];
    toBeDisabled: matcherTypes.TestingLibraryMatchers<T, R>['toBeDisabled'];
    toHaveTextContent: matcherTypes.TestingLibraryMatchers<T, R>['toHaveTextContent'];
  }
}
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(cleanup);

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
