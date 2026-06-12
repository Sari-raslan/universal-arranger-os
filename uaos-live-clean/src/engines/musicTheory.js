const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export function freqToNote(freq){
  if(!freq || freq < 40 || freq > 2000) return null;
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  return {
    midi,
    name: NOTE_NAMES[((midi % 12) + 12) % 12],
    octave: Math.floor(midi / 12) - 1,
    label: NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1),
    freq: Math.round(freq * 10) / 10
  };
}

export function guessChord(notes){
  if(!notes || notes.length < 2) return null;
  const pcs = [...new Set(notes.map(n => ((n % 12) + 12) % 12))];
  const types = [
    {s:"", i:[0,4,7]},
    {s:"m", i:[0,3,7]},
    {s:"7", i:[0,4,7,10]},
    {s:"m7", i:[0,3,7,10]},
    {s:"sus4", i:[0,5,7]}
  ];
  let best = null;
  for(let r=0;r<12;r++){
    for(const t of types){
      const target = t.i.map(x => (r+x)%12);
      const hits = target.filter(x => pcs.includes(x)).length;
      const score = hits / target.length;
      if(!best || score > best.score){
        best = { chord:NOTE_NAMES[r]+t.s, score, notes:pcs.map(x=>NOTE_NAMES[x]) };
      }
    }
  }
  return best && best.score >= 0.66 ? best : null;
}
