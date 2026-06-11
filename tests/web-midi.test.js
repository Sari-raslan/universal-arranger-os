import test from 'node:test';
import assert from 'node:assert/strict';
import { describeMidiSupport, formatMidiMessage, summarizeMidiAccess } from '../uaos-live-clean/src/lib/webMidi.js';

test('detects WebMIDI support from navigator capability', () => {
  assert.deepEqual(describeMidiSupport({ requestMIDIAccess() {} }), { supported: true, label: 'WebMIDI ready' });
  assert.deepEqual(describeMidiSupport({}), { supported: false, label: 'WebMIDI unavailable' });
});

test('formats common MIDI channel messages', () => {
  assert.equal(formatMidiMessage([0x90, 60, 100]), 'CH1 NOTE ON 60 VEL 100');
  assert.equal(formatMidiMessage([0x90, 60, 0]), 'CH1 NOTE OFF 60');
  assert.equal(formatMidiMessage([0xb2, 7, 96]), 'CH3 CC 7 VAL 96');
  assert.equal(formatMidiMessage([0xc4, 12, 0]), 'CH5 PROGRAM 12');
});

test('summarizes MIDI input and output collections', () => {
  const access = {
    inputs: new Map([['in-1', { id: 'in-1', name: 'Controller', manufacturer: 'UAOS', state: 'connected' }]]),
    outputs: new Map([['out-1', { id: 'out-1', name: 'Synth', manufacturer: 'UAOS', state: 'connected' }]])
  };

  assert.deepEqual(summarizeMidiAccess(access), {
    inputs: [{ id: 'in-1', name: 'Controller', manufacturer: 'UAOS', state: 'connected' }],
    outputs: [{ id: 'out-1', name: 'Synth', manufacturer: 'UAOS', state: 'connected' }]
  });
});
