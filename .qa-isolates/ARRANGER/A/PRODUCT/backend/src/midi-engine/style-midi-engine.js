export function generateMidiPlan(arrangement = {}) {
  return {
    ok: true,
    format: 'midi-plan',
    tempo: arrangement.tempo || 100,
    tracks: [
      { name: 'Drums', channel: 10, role: 'rhythm' },
      { name: 'Bass', channel: 2, role: 'bassline' },
      { name: 'Chords', channel: 3, role: 'harmony' },
      { name: 'Lead', channel: 1, role: 'melody' }
    ],
    note: 'Scaffold: connect to real MIDI writer for binary MIDI export.'
  };
}

export function generateStylePlan(arrangement = {}) {
  return {
    ok: true,
    targets: ['Korg SET', 'Yamaha STY', 'Roland style'],
    patterns: ['Intro', 'Main A', 'Main B', 'Fill', 'Ending'],
    sourceTempo: arrangement.tempo || 100,
    note: 'Scaffold: vendor-specific binary encoders required for production style export.'
  };
}
