import test from 'node:test';
import assert from 'node:assert/strict';
import { appendTimelineSection, DEFAULT_TIMELINE, normalizeTimeline, removeTimelineSection, timelineToStructure } from '../uaos-live-clean/src/lib/styleTimeline.js';

test('normalizes empty or invalid timelines to the default style flow', () => {
  assert.deepEqual(normalizeTimeline([]), DEFAULT_TIMELINE);
  assert.deepEqual(timelineToStructure(null), ['Intro', 'Main A', 'Fill', 'Main B', 'Ending']);
});

test('clamps timeline bar counts to a practical editor range', () => {
  assert.deepEqual(normalizeTimeline([{ section: 'Main C', bars: 99 }, { section: 'Break', bars: 0 }]), [
    { section: 'Main C', bars: 64 },
    { section: 'Break', bars: 1 }
  ]);
});

test('appends and removes timeline sections without leaving an empty editor', () => {
  const appended = appendTimelineSection([{ section: 'Intro', bars: 2 }], 'Ending', 4);
  assert.deepEqual(appended, [{ section: 'Intro', bars: 2 }, { section: 'Ending', bars: 4 }]);
  assert.deepEqual(removeTimelineSection([{ section: 'Intro', bars: 2 }], 0), DEFAULT_TIMELINE);
});
