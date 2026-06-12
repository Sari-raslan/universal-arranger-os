const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export function midiToName(midi){
  return NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

export function freqToNote(freq){
  if(!freq || freq < 40 || freq > 2000) return null;
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  return {
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    label: midiToName(midi),
    freq: Math.round(freq * 10) / 10
  };
}

export function autoCorrelate(buffer, sampleRate){
  let size = buffer.length;
  let rms = 0;

  for(let i=0;i<size;i++) rms += buffer[i] * buffer[i];

  rms = Math.sqrt(rms / size);
  if(rms < 0.012) return null;

  let bestOffset = -1;
  let bestCorrelation = 0;

  const minOffset = Math.floor(sampleRate / 1000);
  const maxOffset = Math.floor(sampleRate / 50);

  for(let offset = minOffset; offset < maxOffset; offset++){
    let correlation = 0;
    for(let i=0;i<size-offset;i++){
      correlation += Math.abs(buffer[i] - buffer[i+offset]);
    }
    correlation = 1 - correlation / (size - offset);
    if(correlation > bestCorrelation){
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if(bestCorrelation > 0.88 && bestOffset > 0){
    return sampleRate / bestOffset;
  }

  return null;
}

export function guessChordFromNotes(notes){
  if(!notes || notes.length < 2) return null;

  const pcs = [...new Set(notes.map(n => ((n % 12) + 12) % 12))];

  const chordTypes = [
    { suffix:"", intervals:[0,4,7] },
    { suffix:"m", intervals:[0,3,7] },
    { suffix:"7", intervals:[0,4,7,10] },
    { suffix:"maj7", intervals:[0,4,7,11] },
    { suffix:"m7", intervals:[0,3,7,10] },
    { suffix:"sus4", intervals:[0,5,7] }
  ];

  let best = null;

  for(let root=0; root<12; root++){
    for(const type of chordTypes){
      const target = type.intervals.map(i => (root + i) % 12);
      const hits = target.filter(t => pcs.includes(t)).length;
      const score = hits / target.length;

      if(!best || score > best.score){
        best = {
          chord: NOTE_NAMES[root] + type.suffix,
          root: NOTE_NAMES[root],
          score,
          notes: pcs.map(pc => NOTE_NAMES[pc])
        };
      }
    }
  }

  if(best && best.score >= 0.66) return best;
  return null;
}
