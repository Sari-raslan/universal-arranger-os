import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseSampleForNote, normalizeSampleMap, samplePlaybackRate } from '../uaos-live-clean/src/lib/sampleMap.js';

test('normalizes API sampler maps and ignores placeholders without audio files', () => {
  const samples = normalizeSampleMap([
    { id: 'oud', file: 'oud-c4.wav', rootNote: 60, lowNote: 48, highNote: 72 },
    { id: 'placeholder', file: null }
  ]);

  assert.equal(samples.length, 1);
  assert.equal(samples[0].url, '/samples/oud-c4.wav');
  assert.equal(samples[0].velocityMin, 1);
  assert.equal(samples[0].velocityMax, 127);
});

test('chooses a mapped WAV sample by note and velocity range', () => {
  const samples = normalizeSampleMap({
    samples: [
      { id: 'soft', url: '/samples/soft.wav', lowNote: 48, highNote: 72, velocityMin: 1, velocityMax: 80 },
      { id: 'hard', url: '/samples/hard.wav', lowNote: 48, highNote: 72, velocityMin: 81, velocityMax: 127 }
    ]
  });

  assert.equal(chooseSampleForNote(samples, 60, 40)?.id, 'soft');
  assert.equal(chooseSampleForNote(samples, 60, 100)?.id, 'hard');
  assert.equal(chooseSampleForNote(samples, 90, 100), null);
});

test('computes semitone playback rates from the sample root note', () => {
  assert.equal(samplePlaybackRate(60, 60), 1);
  assert.equal(Number(samplePlaybackRate(72, 60).toFixed(5)), 2);
  assert.equal(Number(samplePlaybackRate(48, 60).toFixed(5)), 0.5);
});
