import {
  loadAllMidiProfiles,
  matchProfileForDevice,
  resolveMidiAction
} from './controllerAbstraction.js';

const profiles = loadAllMidiProfiles('midi-profiles');

const profile = matchProfileForDevice('Generic MIDI Controller', profiles);

const result = resolveMidiAction({
  type: 'noteon',
  channel: 1,
  note: 36,
  velocity: 100
}, profile);

if (result.action !== 'start_style') {
  throw new Error('Expected note 36 to map to start_style.');
}

console.log('MIDI abstraction smoke passed:', result);
