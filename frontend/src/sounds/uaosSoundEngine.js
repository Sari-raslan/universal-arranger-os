import * as Tone from 'tone';

let currentInstrument = null;
let currentEffects = null;

function disposeCurrent() {
  if (currentInstrument) {
    currentInstrument.dispose();
    currentInstrument = null;
  }

  if (currentEffects) {
    for (const effect of currentEffects) {
      effect.dispose();
    }

    currentEffects = null;
  }
}

function envelopeFrom(settings) {
  return {
    attack: settings.attack ?? 0.01,
    decay: settings.decay ?? 0.3,
    sustain: settings.sustain ?? 0.5,
    release: settings.release ?? 0.8
  };
}

export async function startAudioEngine() {
  await Tone.start();
  return true;
}

export function createInstrumentFromPreset(preset) {
  disposeCurrent();

  const settings = preset.settings || {};
  const volume = new Tone.Volume(settings.volume ?? -8).toDestination();

  const reverb = new Tone.Reverb({
    decay: 1.8,
    wet: 0.15
  }).connect(volume);

  const delay = new Tone.FeedbackDelay({
    delayTime: '8n',
    feedback: 0.18,
    wet: 0.08
  }).connect(reverb);

  currentEffects = [volume, reverb, delay];

  if (preset.engine === 'monoSynth') {
    currentInstrument = new Tone.MonoSynth({
      oscillator: {
        type: settings.oscillator || 'sawtooth'
      },
      envelope: envelopeFrom(settings),
      filter: {
        frequency: settings.filter || 800,
        type: 'lowpass',
        rolloff: -24
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.6,
        baseFrequency: 80,
        octaves: 3
      }
    }).connect(delay);

    return currentInstrument;
  }

  if (preset.engine === 'pluckSynth') {
    currentInstrument = new Tone.PluckSynth({
      attackNoise: settings.attackNoise ?? 0.8,
      dampening: settings.dampening ?? 4000,
      resonance: settings.resonance ?? 0.7
    }).connect(delay);

    return currentInstrument;
  }

  if (preset.engine === 'drumSynth') {
    currentInstrument = {
      triggerAttackRelease(note, duration, time, velocity = 1) {
        const kick = new Tone.MembraneSynth().connect(delay);
        const snare = new Tone.NoiseSynth({
          envelope: {
            attack: 0.001,
            decay: 0.15,
            sustain: 0
          }
        }).connect(delay);

        if (note === 'C2') {
          kick.triggerAttackRelease('C1', duration || '8n', time, velocity);
        } else {
          snare.triggerAttackRelease(duration || '16n', time, velocity);
        }

        setTimeout(() => {
          kick.dispose();
          snare.dispose();
        }, 1000);
      },
      dispose() {}
    };

    return currentInstrument;
  }

  currentInstrument = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: settings.oscillator || 'triangle'
    },
    envelope: envelopeFrom(settings)
  }).connect(delay);

  return currentInstrument;
}

export function playNote(note = 'C4', duration = '4n', velocity = 0.9) {
  if (!currentInstrument) return;

  currentInstrument.triggerAttackRelease(note, duration, undefined, velocity);
}

export function playChord(notes = ['C4', 'E4', 'G4'], duration = '2n') {
  if (!currentInstrument) return;

  if (Array.isArray(notes)) {
    currentInstrument.triggerAttackRelease(notes, duration);
  }
}

export function playDemoPattern(category = 'piano') {
  if (!currentInstrument) return;

  const now = Tone.now();

  if (category === 'bass') {
    currentInstrument.triggerAttackRelease('C2', '8n', now);
    currentInstrument.triggerAttackRelease('G1', '8n', now + 0.35);
    currentInstrument.triggerAttackRelease('A1', '8n', now + 0.7);
    currentInstrument.triggerAttackRelease('F1', '8n', now + 1.05);
    return;
  }

  if (category === 'drums') {
    currentInstrument.triggerAttackRelease('C2', '8n', now);
    currentInstrument.triggerAttackRelease('D2', '16n', now + 0.5);
    currentInstrument.triggerAttackRelease('C2', '8n', now + 1.0);
    currentInstrument.triggerAttackRelease('D2', '16n', now + 1.5);
    return;
  }

  currentInstrument.triggerAttackRelease(['C4', 'E4', 'G4'], '4n', now);
  currentInstrument.triggerAttackRelease(['F4', 'A4', 'C5'], '4n', now + 0.6);
  currentInstrument.triggerAttackRelease(['G4', 'B4', 'D5'], '4n', now + 1.2);
  currentInstrument.triggerAttackRelease(['C4', 'E4', 'G4'], '2n', now + 1.8);
}
