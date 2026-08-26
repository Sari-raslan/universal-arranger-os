export function buildOmrTrainingJob(input = {}) {
  return {
    ok: true,
    dataset: input.dataset || [],
    labels: ['staff', 'clef', 'notehead', 'stem', 'beam', 'rest', 'barline'],
    stages: [
      'image normalization',
      'staff-line detection',
      'symbol labeling',
      'rhythm reconstruction',
      'MusicXML validation',
      'MIDI validation'
    ],
    note: 'Scaffold: real OMR requires labeled dataset and trained CV/ML models.'
  };
}
