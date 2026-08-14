import './test-env.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { isSyntheticTaskId } from '../src/lib.mjs';

// Tests that exercise nextRunnableTask/writeMasterStatus against the live L-SYN-DEP fixture
// live in cursor-local-claim.test.mjs instead of here — that fixture has no per-test isolation
// of its own, and node --test runs files in parallel, so every test that mutates its live state
// has to stay co-located with the rest to avoid racing them (see that file for the full story).

test('isSyntheticTaskId recognizes the established L-SYN/S-SYN/A-SYN fixture convention', () => {
  assert.equal(isSyntheticTaskId('L-SYN-DEP'), true);
  assert.equal(isSyntheticTaskId('L-SYN-GENERIC'), true);
  assert.equal(isSyntheticTaskId('S-SYN-FOO'), true);
  assert.equal(isSyntheticTaskId('A-SYN-BAR'), true);
  assert.equal(isSyntheticTaskId('L-120'), false);
  assert.equal(isSyntheticTaskId('A-110'), false);
  assert.equal(isSyntheticTaskId('S-090R1'), false);
  assert.equal(isSyntheticTaskId(''), false);
  assert.equal(isSyntheticTaskId(null), false);
  assert.equal(isSyntheticTaskId(undefined), false);
});
