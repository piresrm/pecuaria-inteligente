import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePerformance } from './performance.mjs';

test('summarizes measured budgets and preserves unmeasured gates', () => {
  const result = summarizePerformance({
    revision: '59838c6',
    bundle: { essentialBytes: 102149, chartAdditionalBytes: 56282 },
    timings: [],
    api: null,
  });
  assert.equal(result.budgets.essential.status, 'pass');
  assert.equal(result.budgets.chartAdditional.status, 'pass');
  assert.equal(result.acceptance.performance.status, 'unmeasured');
  assert.equal(result.acceptance.api.status, 'unmeasured');
});
