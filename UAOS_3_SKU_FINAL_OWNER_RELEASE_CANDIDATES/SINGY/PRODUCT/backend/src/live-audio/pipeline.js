import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { buildMelodyFromPitchEvents, frequencyToMidiNote } from './pitch-detection.js';
import { melodyToMidi } from './midi-export.js';
import { arrangeMelody } from './arranger.js';

export function analyzeFrequencySequence(frequencies, mode = 'full') {
  const id = uuidv4();
  const events = frequencies
    .map((freq) => frequencyToMidiNote(Number(freq)))
    .filter(Boolean);
  const melody = buildMelodyFromPitchEvents(events);

  const midiPath = path.join('generated-midi', 'live-audio', `${id}.mid`);
  const arrangementPath = path.join('generated-arrangements', `${id}.json`);

  fs.mkdirSync(path.dirname(midiPath), { recursive: true });
  fs.mkdirSync(path.dirname(arrangementPath), { recursive: true });
  melodyToMidi(melody, midiPath, 100);

  const arrangement = arrangeMelody(melody, mode);
  fs.writeFileSync(arrangementPath, JSON.stringify(arrangement, null, 2));

  return {
    ok: true,
    id,
    mode,
    notes: melody,
    midiPath,
    arrangementPath,
    arrangement,
    quality: {
      level: 'live-mvp',
      note: 'Live frequency-to-MIDI and arrangement scaffold. Production version should use autocorrelation/YIN/CREPE pitch detection.'
    }
  };
}
