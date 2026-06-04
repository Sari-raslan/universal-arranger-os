import test from 'node:test';
import assert from 'node:assert/strict';
import { selectExplorerState } from '../frontend/src/explorerState.js';

const library = [
  { id: 'Korg/sar.SET', name: 'sar.SET', isDirectory: true, size: 300, updatedAt: '2026-05-27T12:00:00.000Z' },
  { id: 'uploads/beat.mid', name: 'beat.mid', isDirectory: false, size: 20, updatedAt: '2026-05-28T12:00:00.000Z' },
  { id: 'uploads/bank.syx', name: 'bank.syx', isDirectory: false, size: 40, updatedAt: '2026-05-26T12:00:00.000Z' }
];

test('explorer search keeps selected row stable when hidden', () => {
  const state = selectExplorerState(library, 'Korg/sar.SET', 'beat', null);

  assert.deepEqual(state.rows.map((row) => row.id), ['uploads/beat.mid']);
  assert.equal(state.selectedRow.id, 'Korg/sar.SET');
  assert.equal(state.stats.totalCount, 3);
  assert.equal(state.stats.visibleCount, 1);
});

test('category chips count the searched visible set', () => {
  const state = selectExplorerState(library, null, '', null, { categoryFilter: 'midi' });
  const counts = Object.fromEntries(state.categoryChips.map((chip) => [chip.key, chip.count]));

  assert.equal(counts.all, 3);
  assert.equal(counts.set, 1);
  assert.equal(counts.midi, 1);
  assert.equal(counts.sysex, 1);
  assert.deepEqual(state.rows.map((row) => row.id), ['uploads/beat.mid']);
});

test('sort applies after filtering and has stable name fallback', () => {
  const state = selectExplorerState(library, null, '', null, {
    categoryFilter: 'all',
    sort: { key: 'size', direction: 'asc' }
  });

  assert.deepEqual(state.rows.map((row) => row.id), ['uploads/beat.mid', 'uploads/bank.syx', 'Korg/sar.SET']);
});
