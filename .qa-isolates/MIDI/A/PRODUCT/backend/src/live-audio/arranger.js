export function arrangeMelody(melody, mode = 'full') {
  const root = melody[0]?.pitch || 'C4';

  const base = {
    mode,
    sourceMelody: melody,
    tempo: 100,
    keyGuess: root.replace(/[0-9]/g, ''),
    sections: []
  };

  if (mode === 'ork') {
    base.sections = [
      {
        name: 'Ork Intro',
        tracks: [
          { instrument: 'strings', role: 'pad', notes: melody },
          { instrument: 'brass', role: 'accent', notes: melody.filter((_, index) => index % 2 === 0) },
          { instrument: 'percussion', role: 'pulse', pattern: 'dum-tek-dum-tek' }
        ]
      }
    ];
  } else if (mode === 'studio') {
    base.sections = [
      {
        name: 'Computer Studio Groove',
        tracks: [
          { instrument: 'synth lead', role: 'melody', notes: melody },
          { instrument: 'bass', role: 'bassline', pattern: 'root-octave' },
          { instrument: 'drums', role: 'beat', pattern: 'four-on-floor' }
        ]
      }
    ];
  } else {
    base.sections = [
      {
        name: 'Full Arrangement',
        tracks: [
          { instrument: 'piano', role: 'chords', pattern: 'block-chords' },
          { instrument: 'bass', role: 'bassline', pattern: 'root-fifth' },
          { instrument: 'drums', role: 'rhythm', pattern: 'pop-ballad' },
          { instrument: 'strings', role: 'pad', notes: melody },
          { instrument: 'lead', role: 'melody', notes: melody }
        ]
      }
    ];
  }

  return base;
}
